import { supabase } from '../supabaseClient';

// Carica tutto il progresso di uno studente in una sola query
export const loadAllProgress = async (studentId) => {
  const id = parseInt(studentId, 10);
  const { data, error } = await supabase
    .from('progress')
    .select('id, completed_objectives, objective_steps, objective_comments')
    .eq('student_id', id)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('loadAllProgress error:', error);
    throw error;
  }
  return {
    rowId: data?.id || null,
    completedObjectives: data?.completed_objectives || {},
    objectiveSteps: data?.objective_steps || {},
    objectiveComments: data?.objective_comments || {}
  };
};

// Salva (insert o update) il progresso — non richiede constraint UNIQUE
export const saveAllProgress = async (studentId, patch) => {
  const id = parseInt(studentId, 10);
  const payload = {};
  if ('completedObjectives' in patch) payload.completed_objectives = patch.completedObjectives;
  if ('objectiveSteps' in patch) payload.objective_steps = patch.objectiveSteps;
  if ('objectiveComments' in patch) payload.objective_comments = patch.objectiveComments;

  const { data: existing, error: selectError } = await supabase
    .from('progress')
    .select('id')
    .eq('student_id', id)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error('saveAllProgress select error:', selectError);
    throw selectError;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('progress')
      .update(payload)
      .eq('id', existing.id);
    if (error) {
      console.error('saveAllProgress update error:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('progress')
      .insert({ student_id: id, ...payload });
    if (error) {
      console.error('saveAllProgress insert error:', error);
      throw error;
    }
  }
};

// Wrapper compatibili con il codice esistente
export const loadStudentProgress = async (studentId) => {
  const { completedObjectives } = await loadAllProgress(studentId);
  return completedObjectives;
};

export const saveStudentProgress = async (studentId, completedObjectives) => {
  await saveAllProgress(studentId, { completedObjectives });
};

export const loadObjectiveSteps = async (studentId) => {
  const { objectiveSteps } = await loadAllProgress(studentId);
  return objectiveSteps;
};

export const saveObjectiveSteps = async (studentId, objectiveSteps) => {
  await saveAllProgress(studentId, { objectiveSteps });
};

export const loadObjectiveComments = async (studentId) => {
  const { objectiveComments } = await loadAllProgress(studentId);
  return objectiveComments;
};

export const saveObjectiveComments = async (studentId, objectiveComments) => {
  await saveAllProgress(studentId, { objectiveComments });
};

// Generic CRUD (legacy)
export const getAllProgress = async () => {
  const { data, error } = await supabase.from('progress').select('*');
  if (error) throw error;
  return data;
};

export const addProgress = async (progress) => {
  const { data, error } = await supabase.from('progress').insert([progress]).single();
  if (error) throw error;
  return data;
};

export const updateProgress = async (progress) => {
  const { data, error } = await supabase
    .from('progress')
    .update(progress)
    .eq('id', progress.id)
    .single();
  if (error) throw error;
  return data;
};

export const deleteProgress = async (progressId) => {
  const { error } = await supabase.from('progress').delete().eq('id', progressId);
  if (error) throw error;
  return true;
};
