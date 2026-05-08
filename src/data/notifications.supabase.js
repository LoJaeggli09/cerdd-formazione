import { supabase } from '../supabaseClient';

// Normalizza riga DB (snake_case) → formato atteso dall'app (camelCase)
const normalizeNotif = (row) => ({
  id: row.id,
  user_id: row.user_id,
  studentId: row.sender_id ?? null,
  studentName: row.sender_name ?? '',
  objectiveId: row.objective_id ?? null,
  type: row.type || 'completion',
  read: row.read || false,
  timestamp: row.timestamp || row.created_at || null,
  title: row.title || '',
});

export const getAllNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data.map(normalizeNotif);
};

// Crea una notifica strutturata (es. completamento obiettivo)
export const createNotification = async (recipientId, senderName, objectiveId, type = 'completion', senderId = null) => {
  const row = {
    user_id: parseInt(recipientId, 10),
    sender_id: senderId ? parseInt(senderId, 10) : null,
    sender_name: senderName,
    objective_id: objectiveId,
    type,
    read: false,
    timestamp: new Date().toISOString(),
    title: type === 'completion'
      ? `${senderName} ha completato l'obiettivo ${objectiveId}`
      : `Obiettivo ${objectiveId} approvato`,
  };
  const { data, error } = await supabase.from('notifications').insert([row]).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return normalizeNotif(data);
};

export const addNotification = async (notification) => {
  const { data, error } = await supabase.from('notifications').insert([notification]).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return normalizeNotif(data);
};

export const updateNotification = async (notification) => {
  const { data, error } = await supabase
    .from('notifications')
    .update(notification)
    .eq('id', notification.id)
    .select()
    .single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return normalizeNotif(data);
};

export const deleteNotification = async (notificationId) => {
  const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return true;
};

export const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return true;
};

export const markAllNotificationsAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', parseInt(userId, 10))
    .eq('read', false);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return true;
};

export const deleteReadNotifications = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', parseInt(userId, 10))
    .eq('read', true);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return true;
};

// --- Approvals (storati come notifiche di tipo 'approval') ---

// Chiamato dal trainer in InboxSection quando approva un obiettivo
export const approveObjective = async (studentId, objectiveId, trainerName = 'Formatore', trainerId = null) => {
  const row = {
    user_id: parseInt(studentId, 10),
    sender_id: trainerId ? parseInt(trainerId, 10) : null,
    sender_name: trainerName,
    objective_id: objectiveId,
    type: 'approval',
    read: false,
    timestamp: new Date().toISOString(),
    title: `${trainerName} ha approvato l'obiettivo ${objectiveId}`,
  };
  const { data, error } = await supabase.from('notifications').insert([row]).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return normalizeNotif(data);
};

// Carica gli obiettivi approvati per uno studente → { [objectiveId]: { approved: true, timestamp } }
export const loadStudentApprovals = async (studentId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', parseInt(studentId, 10))
    .eq('type', 'approval');
  if (error) throw new Error(error.message || JSON.stringify(error));
  const result = {};
  (data || []).forEach((row) => {
    if (row.objective_id) {
      result[row.objective_id] = { approved: true, timestamp: row.timestamp };
    }
  });
  return result;
};

// Resetta le approvazioni di uno studente (es. al reset del progresso)
export const resetStudentApprovals = async (studentId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', parseInt(studentId, 10))
    .eq('type', 'approval');
  if (error) throw new Error(error.message || JSON.stringify(error));
  return true;
};
