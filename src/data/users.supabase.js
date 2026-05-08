import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Restituisce true se la stringa è già un hash bcrypt
const isBcryptHash = (s) => typeof s === 'string' && s.startsWith('$2');

// Hash della password (solo se non già hashata)
const hashPassword = async (plain) => {
  if (isBcryptHash(plain)) return plain;
  return bcrypt.hash(plain, SALT_ROUNDS);
};

// Confronto password: gestisce sia hash bcrypt sia migrazione plain-text
const verifyPassword = async (plain, stored) => {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored);
  }
  // Password vecchia in chiaro — confronto diretto per la migrazione
  return plain.trim() === stored.trim();
};

// Normalizza un utente Supabase nel formato atteso dall'app
const normalizeUser = (u) => ({
  id: u.id,
  username: `${u.nome} ${u.cognome}`,
  name: `${u.nome} ${u.cognome}`,
  nome: u.nome,
  cognome: u.cognome,
  email: u.email,
  role: u.ruolo,
  ruolo: u.ruolo,
  stato: u.stato,
  password: u.password_hash,
  trainerId: u.trainer_id || null,
  inspectorId: u.inspector_id || null,
  studentNumber: u.numero_studente || null,
  formationYear: u.anno_formazione || null,
  apprenticeshipStart: u.data_inizio_apprendistato || null,
  apprenticeshipEnd: u.data_fine_apprendistato || null,
  mustChangePassword: u.must_change_password || false,
  settings: { language: 'it', darkMode: false },
});

// Converte dal formato app al formato colonne DB
const denormalizeUser = (user) => {
  const parts = (user.name || user.username || '').trim().split(' ');
  const nome = parts[0] || '';
  const cognome = parts.slice(1).join(' ') || '';
  const row = {
    ruolo: user.role,
    password_hash: user.password || user.password_hash || 'Abc123!',
    trainer_id: user.trainerId ? parseInt(user.trainerId, 10) : null,
    inspector_id: user.inspectorId ? parseInt(user.inspectorId, 10) : null,
    numero_studente: user.studentNumber || null,
    anno_formazione: user.formationYear ? parseInt(user.formationYear, 10) : null,
    data_inizio_apprendistato: user.apprenticeshipStart || null,
    data_fine_apprendistato: user.apprenticeshipEnd || null,
  };
  if (user.nome || nome) row.nome = user.nome || nome;
  if (user.cognome || cognome) row.cognome = user.cognome || cognome;
  if (user.email) row.email = user.email;
  return row;
};

// Leggi tutti gli utenti
export const getAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data.map(normalizeUser);
};

// Aggiungi un utente
export const addUser = async (user) => {
  const row = denormalizeUser(user);
  // Hash della password prima di salvare
  if (row.password_hash) {
    row.password_hash = await hashPassword(row.password_hash);
  }
  // I nuovi utenti partono con la password predefinita → devono cambiarla al primo accesso
  row.must_change_password = true;
  const { data, error } = await supabase.from('users').insert([row]).select().single();
  if (error) throw error;
  return normalizeUser(data);
};

// Aggiorna un utente
export const updateUser = async (user) => {
  const row = denormalizeUser(user);
  const { data, error } = await supabase
    .from('users')
    .update(row)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return normalizeUser(data);
};

// Elimina un utente
export const deleteUser = async (userId) => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
  return true;
};

// Restituisce tutti gli studenti (ruolo = 'student')
export const getAllStudents = async () => {
  const { data, error } = await supabase.from('users').select('*').eq('ruolo', 'student');
  if (error) throw error;
  return data.map(normalizeUser);
};

// Restituisce tutti gli studenti di un formatore
export const getStudentsByTrainer = async (trainerId) => {
  const { data, error } = await supabase.from('users').select('*').eq('ruolo', 'student').eq('trainer_id', trainerId);
  if (error) throw error;
  return data.map(normalizeUser);
};

// Restituisce tutti gli studenti di un ispettore
export const getStudentsByInspector = async (inspectorId) => {
  const { data, error } = await supabase.from('users').select('*').eq('ruolo', 'student').eq('inspector_id', inspectorId);
  if (error) throw error;
  return data.map(normalizeUser);
};

// Aggiorna la password di un utente
export const updateUserPassword = async (userId, newPassword) => {
  const hashed = await hashPassword(newPassword);
  const { error } = await supabase
    .from('users')
    .update({ password_hash: hashed, must_change_password: false })
    .eq('id', userId);
  if (error) throw error;
  return true;
};

// Reimposta la password di un utente alla password predefinita
export const resetUserPasswordToDefault = async (userId) => {
  const hashed = await hashPassword('Abc123!');
  const { error } = await supabase
    .from('users')
    .update({ password_hash: hashed, must_change_password: true })
    .eq('id', userId);
  if (error) throw error;
  return true;
};

// Recupera un singolo utente per id (usato per verificare il flag al restore della sessione)
export const getUserById = async (userId) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return normalizeUser(data);
};

// Restituisce il formatore di uno studente
export const getTrainerForStudent = async (studentId) => {
  const { data: student, error: sErr } = await supabase
    .from('users')
    .select('trainer_id')
    .eq('id', parseInt(studentId, 10))
    .maybeSingle();
  if (sErr || !student?.trainer_id) return null;
  const { data: trainer, error: tErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', student.trainer_id)
    .maybeSingle();
  if (tErr || !trainer) return null;
  return normalizeUser(trainer);
};

// Autentica un utente (username = nome + cognome oppure email)
export const authenticateUser = async (username, password) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;

  const normalized = username.trim().replace(/\s+/g, ' ').toLowerCase();

  const u = data.find((user) => {
    const fullName = `${user.nome} ${user.cognome}`.trim().replace(/\s+/g, ' ').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return fullName === normalized || email === normalized;
  });

  if (!u) return null;

  const match = await verifyPassword(password, u.password_hash || '');
  if (!match) return null;

  // Migrazione trasparente: se la password era in chiaro, la hashiamo ora
  if (!isBcryptHash(u.password_hash)) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await supabase.from('users').update({ password_hash: hashed }).eq('id', u.id);
  }

  const normalizedUser = normalizeUser(u);
  // Forza cambio password se il flag DB è attivo OPPURE (fallback) la password è quella predefinita
  if (normalizedUser.mustChangePassword || password === 'Abc123!') {
    normalizedUser.mustChangePassword = true;
  }
  return normalizedUser;
};
