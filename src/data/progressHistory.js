// Sistema di tracking storico dei progressi

/**
 * Salva uno snapshot del progresso corrente
 */
export const saveProgressSnapshot = (userId, progressData) => {
  try {
    const historyKey = `progressHistory_${userId}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const snapshot = {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      overallProgress: progressData.overallProgress,
      fieldProgress: progressData.fieldProgress, // progresso per campo
      completedObjectives: progressData.completedObjectives,
      totalObjectives: progressData.totalObjectives,
      activeObjectives: progressData.activeObjectives
    };
    
    history.push(snapshot);
    
    // Mantieni solo gli ultimi 90 giorni di storia
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(s => s.timestamp > ninetyDaysAgo);
    
    localStorage.setItem(historyKey, JSON.stringify(filteredHistory));
    return true;
  } catch (error) {
    console.error('Errore salvataggio snapshot progresso:', error);
    return false;
  }
};

/**
 * Recupera la storia dei progressi per un utente
 */
export const getProgressHistory = (userId) => {
  try {
    const historyKey = `progressHistory_${userId}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    return history;
  } catch (error) {
    console.error('Errore recupero storia progressi:', error);
    return [];
  }
};

/**
 * Cancella la storia progressi di un utente
 */
export const clearProgressHistory = (userId) => {
  try {
    const historyKey = `progressHistory_${userId}`;
    localStorage.removeItem(historyKey);
    return true;
  } catch (error) {
    console.error('Errore cancellazione storia progressi:', error);
    return false;
  }
};

/**
 * Raggruppa i dati storici per periodo (giorno, settimana, mese)
 */
export const groupHistoryByPeriod = (history, period = 'week') => {
  if (!history || history.length === 0) return [];
  
  const grouped = {};
  
  history.forEach(snapshot => {
    const date = new Date(snapshot.date);
    let key;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped[key] || snapshot.timestamp > grouped[key].timestamp) {
      grouped[key] = snapshot;
    }
  });
  
  return Object.entries(grouped)
    .map(([key, snapshot]) => ({ ...snapshot, periodKey: key }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Calcola la velocità di completamento (obiettivi/settimana)
 */
export const calculateCompletionRate = (history) => {
  if (!history || history.length < 2) return 0;
  
  const firstSnapshot = history[0];
  const lastSnapshot = history[history.length - 1];
  
  const timeDiffMs = lastSnapshot.timestamp - firstSnapshot.timestamp;
  const timeDiffWeeks = timeDiffMs / (7 * 24 * 60 * 60 * 1000);
  
  const completedDiff = lastSnapshot.completedObjectives - firstSnapshot.completedObjectives;
  
  return timeDiffWeeks > 0 ? (completedDiff / timeDiffWeeks).toFixed(2) : 0;
};

/**
 * Previsione completamento basata sul trend
 */
export const estimateCompletion = (history, totalObjectives) => {
  if (!history || history.length < 2) return null;
  
  const rate = parseFloat(calculateCompletionRate(history));
  if (rate <= 0) return null;
  
  const lastSnapshot = history[history.length - 1];
  const remaining = totalObjectives - lastSnapshot.completedObjectives;
  
  const weeksToComplete = remaining / rate;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + (weeksToComplete * 7));
  
  return {
    weeksRemaining: Math.ceil(weeksToComplete),
    estimatedDate: estimatedDate.toISOString().split('T')[0],
    currentRate: rate
  };
};

/**
 * Rileva il campo con maggiore incremento recente
 */
export const findFastestGrowingField = (history) => {
  if (!history || history.length < 2) return null;
  
  const recentSnapshots = history.slice(-4); // ultimi 4 snapshot
  if (recentSnapshots.length < 2) return null;
  
  const first = recentSnapshots[0];
  const last = recentSnapshots[recentSnapshots.length - 1];
  
  if (!first.fieldProgress || !last.fieldProgress) return null;
  
  let maxGrowth = 0;
  let fastestField = null;
  
  Object.keys(last.fieldProgress).forEach(field => {
    const startProgress = first.fieldProgress[field] || 0;
    const endProgress = last.fieldProgress[field] || 0;
    const growth = endProgress - startProgress;
    
    if (growth > maxGrowth) {
      maxGrowth = growth;
      fastestField = field;
    }
  });
  
  return fastestField ? { field: fastestField, growth: maxGrowth.toFixed(1) } : null;
};
