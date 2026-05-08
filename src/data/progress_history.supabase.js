import { supabase } from '../supabaseClient';

// Converte riga DB (snake_case) → formato atteso dall'app (camelCase)
const normalizeSnapshot = (row) => ({
  id: row.id,
  user_id: row.user_id,
  timestamp: row.timestamp,
  date: row.date,
  overallProgress: row.overall_progress,
  completedObjectives: row.completed_objectives,
  totalObjectives: row.total_objectives,
  activeObjectives: row.active_objectives,
  fieldProgress: row.field_progress || {},
  fieldCompleted: row.field_completed || {},
  fieldTotals: row.field_totals || {},
});

export const getAllProgressHistory = async () => {
  const { data, error } = await supabase.from('progress_history').select('*');
  if (error) throw error;
  return data.map(normalizeSnapshot);
};

export const saveProgressSnapshot = async (userId, progressData) => {
  const row = {
    user_id: parseInt(userId, 10),
    timestamp: Date.now(),
    date: new Date().toISOString(),
    overall_progress: progressData.overallProgress,
    completed_objectives: progressData.completedObjectives,
    total_objectives: progressData.totalObjectives,
    active_objectives: progressData.activeObjectives,
    field_progress: progressData.fieldProgress || {},
    field_completed: progressData.fieldCompleted || {},
    field_totals: progressData.fieldTotals || {},
  };
  const { data, error } = await supabase.from('progress_history').insert([row]).select().single();
  if (error) throw error;
  return normalizeSnapshot(data);
};

export const addProgressHistory = async (history) => {
  const { data, error } = await supabase.from('progress_history').insert([history]).select().single();
  if (error) throw error;
  return data;
};

export const updateProgressHistory = async (history) => {
  const { data, error } = await supabase
    .from('progress_history')
    .update(history)
    .eq('id', history.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProgressHistory = async (historyId) => {
  const { error } = await supabase.from('progress_history').delete().eq('id', historyId);
  if (error) throw error;
  return true;
};

// Elimina tutto lo storico di uno studente (usato al reset progresso)
export const clearProgressHistory = async (userId) => {
  const { error } = await supabase
    .from('progress_history')
    .delete()
    .eq('user_id', parseInt(userId, 10));
  if (error) throw error;
  return true;
};

