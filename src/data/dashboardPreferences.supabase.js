import { supabase } from '../supabaseClient';

const DEFAULT_PREFERENCES = {
  showProfile: true,
  showProgress: true,
  showQuickActions: true,
  shortcuts: [],
};

// Carica le preferenze dashboard di un utente dalla colonna settings in users
export const loadDashboardPreferences = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('settings')
    .eq('id', parseInt(userId, 10))
    .maybeSingle();
  if (error || !data) return { ...DEFAULT_PREFERENCES };
  const settings = data.settings || {};
  const prefs = settings.dashboardPreferences || {};
  return { ...DEFAULT_PREFERENCES, ...prefs };
};

// Salva le preferenze dashboard di un utente nella colonna settings in users
export const saveDashboardPreferences = async (userId, preferences) => {
  // Prima leggi le settings esistenti per non sovrascrivere altri campi
  const { data, error: readErr } = await supabase
    .from('users')
    .select('settings')
    .eq('id', parseInt(userId, 10))
    .maybeSingle();
  if (readErr) throw readErr;

  const existing = (data && data.settings) ? data.settings : {};
  const updated = { ...existing, dashboardPreferences: preferences };

  const { error } = await supabase
    .from('users')
    .update({ settings: updated })
    .eq('id', parseInt(userId, 10));
  if (error) throw error;
  return true;
};
