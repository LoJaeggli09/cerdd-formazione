import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { translate } from '../i18n';
import { trainingPlan } from '../data/trainingPlan';
import { getAllProgressHistory } from '../data/progress_history.supabase';
import { calculateCompletionRate, estimateCompletion, findFastestGrowingField } from '../data/progressHistory';

const FIELD_COLORS = {
  A: '#22c55e',
  B: '#eab308',
  C: '#3b82f6',
  D: '#8b5cf6'
};

const FIELD_IDS = (trainingPlan.competenceFields || []).map((field) => field.id);

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const buildDateRange = (startKey, endKey) => {
  const dates = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
};

const getMonthStartKey = (monthKey) => `${monthKey}-01`;

const getMonthEndKey = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const endDate = new Date(year, month, 0);
  return toDateKey(endDate);
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const parseItalianDate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getFieldObjectiveTotals = () => {
  const totals = {};
  (trainingPlan.competenceFields || []).forEach((field) => {
    let total = 0;
    (field.competencies || []).forEach((competency) => {
      total += (competency.objectives || []).length;
    });
    totals[field.id] = total;
  });
  return totals;
};

const ProgressTrendChart = ({ userId, totalObjectives, language = 'it', apprenticeshipStart, apprenticeshipEnd }) => {
  const t = (key) => translate(key, language);
  const [history, setHistory] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [stats, setStats] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const allHistory = await getAllProgressHistory();
      const userHistory = allHistory.filter(h => String(h.user_id) === String(userId));
      setHistory(userHistory);
    } catch (error) {
      setHistory([]);
      console.error('Errore caricamento storico avanzamento da Supabase:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleProgressUpdated = () => {
      loadHistory();
    };

    window.addEventListener('progress-history-updated', handleProgressUpdated);
    window.addEventListener('storage', handleProgressUpdated);

    return () => {
      window.removeEventListener('progress-history-updated', handleProgressUpdated);
      window.removeEventListener('storage', handleProgressUpdated);
    };
  }, [loadHistory]);

  useEffect(() => {
    if (!history || history.length === 0) {
      setDailyHistory([]);
      setChartData([]);
      setAvailableMonths([]);
      setStats(null);
      return;
    }

    const groupedByDay = {};
    const sortedByTimestamp = [...history].sort((a, b) => a.timestamp - b.timestamp);

    sortedByTimestamp.forEach((snapshot) => {
      const dateKey = (snapshot.date || '').split('T')[0];
      if (!dateKey) return;
      if (!groupedByDay[dateKey] || snapshot.timestamp > groupedByDay[dateKey].timestamp) {
        groupedByDay[dateKey] = snapshot;
      }
    });

    const todayDate = new Date();
    const parsedStart = parseItalianDate(apprenticeshipStart);
    const parsedEnd = parseItalianDate(apprenticeshipEnd);

    const fallbackStart = new Date(todayDate);
    fallbackStart.setDate(fallbackStart.getDate() - 364);

    const rangeStartDate = parsedStart || fallbackStart;
    const rangeEndDate = parsedEnd && parsedEnd >= rangeStartDate ? parsedEnd : todayDate;

    const rangeStartKey = toDateKey(rangeStartDate);
    const rangeEndKey = toDateKey(rangeEndDate);
    const fullDateRange = buildDateRange(rangeStartKey, rangeEndKey);

    const baselineTotalBeforeRange = sortedByTimestamp
      .filter((snapshot) => {
        const snapshotDateKey = (snapshot.date || '').split('T')[0];
        return snapshotDateKey && snapshotDateKey < rangeStartKey;
      })
      .reduce((acc, snapshot) => snapshot.completedObjectives || acc, 0);

    const fieldObjectiveTotals = getFieldObjectiveTotals();
    const fieldIds = Object.keys(fieldObjectiveTotals);

    let previousTotal = baselineTotalBeforeRange;
    let runningTotal = baselineTotalBeforeRange;
    let previousFieldTotals = fieldIds.reduce((acc, fieldId) => {
      acc[fieldId] = 0;
      return acc;
    }, {});

    sortedByTimestamp
      .filter((snapshot) => {
        const snapshotDateKey = (snapshot.date || '').split('T')[0];
        return snapshotDateKey && snapshotDateKey < rangeStartKey;
      })
      .forEach((snapshot) => {
        fieldIds.forEach((fieldId) => {
          const completedCount = snapshot.fieldCompleted?.[fieldId];
          if (typeof completedCount === 'number') {
            previousFieldTotals[fieldId] = Math.max(0, completedCount);
            return;
          }

          const percent = snapshot.fieldProgress?.[fieldId];
          if (typeof percent === 'number') {
            previousFieldTotals[fieldId] = Math.max(0, Math.round((percent / 100) * (fieldObjectiveTotals[fieldId] || 0)));
          }
        });
      });

    let runningFieldTotals = { ...previousFieldTotals };

    const sortedDaily = fullDateRange.map((dateKey) => {
      const snapshot = groupedByDay[dateKey];
      if (snapshot) {
        runningTotal = snapshot.completedObjectives || 0;
        fieldIds.forEach((fieldId) => {
          const completedCount = snapshot.fieldCompleted?.[fieldId];
          if (typeof completedCount === 'number') {
            runningFieldTotals[fieldId] = Math.max(0, completedCount);
            return;
          }

          const percent = snapshot.fieldProgress?.[fieldId];
          if (typeof percent === 'number') {
            runningFieldTotals[fieldId] = Math.max(0, Math.round((percent / 100) * (fieldObjectiveTotals[fieldId] || 0)));
          }
        });
      }

      const dailyCompleted = Math.max(0, runningTotal - previousTotal);
      const dailyByField = {};
      fieldIds.forEach((fieldId) => {
        const dailyFieldCompleted = Math.max(0, (runningFieldTotals[fieldId] || 0) - (previousFieldTotals[fieldId] || 0));
        dailyByField[`field_${fieldId}`] = dailyFieldCompleted;
      });

      previousTotal = runningTotal;
      previousFieldTotals = { ...runningFieldTotals };

      return {
        date: dateKey,
        completed: dailyCompleted,
        totalCompleted: runningTotal,
        active: snapshot?.activeObjectives || 0,
        ...dailyByField
      };
    });

    setDailyHistory(sortedDaily);

    const months = [];
    const rangeStartMonthDate = new Date(rangeStartDate.getFullYear(), rangeStartDate.getMonth(), 1);
    const rangeEndMonthDate = new Date(rangeEndDate.getFullYear(), rangeEndDate.getMonth(), 1);
    const cursorMonth = new Date(rangeStartMonthDate);

    while (cursorMonth <= rangeEndMonthDate) {
      const monthKey = getMonthKey(cursorMonth);
      months.push({
        value: monthKey,
        label: cursorMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      });
      cursorMonth.setMonth(cursorMonth.getMonth() + 1);
    }

    months.sort((a, b) => a.value.localeCompare(b.value));

    setAvailableMonths(months);

    const monthValues = months.map((month) => month.value);
    if (months.length > 0 && (!selectedMonth || !monthValues.includes(selectedMonth))) {
      setSelectedMonth(months[months.length - 1].value);
    }

    const rate = calculateCompletionRate(history);
    const estimate = estimateCompletion(history, totalObjectives);
    const fastestField = findFastestGrowingField(history);
    setStats({ rate, estimate, fastestField });
  }, [history, totalObjectives, apprenticeshipStart, apprenticeshipEnd]);

  useEffect(() => {
    if (!dailyHistory || dailyHistory.length === 0) {
      setChartData([]);
      return;
    }

    const dailyMap = dailyHistory.reduce((acc, item) => {
      acc[item.date] = item;
      return acc;
    }, {});

    const getLastKnownTotal = (dateKey) => {
      for (let index = dailyHistory.length - 1; index >= 0; index -= 1) {
        if (dailyHistory[index].date <= dateKey) {
          return dailyHistory[index].totalCompleted || 0;
        }
      }
      return 0;
    };

    if (selectedMonth) {
      const monthStart = getMonthStartKey(selectedMonth);
      const monthEnd = getMonthEndKey(selectedMonth);
      const monthDates = buildDateRange(monthStart, monthEnd);
      const monthItems = monthDates.map((dateKey) => {
        const item = dailyMap[dateKey];
        const byField = FIELD_IDS.reduce((acc, fieldId) => {
          acc[`field_${fieldId}`] = item?.[`field_${fieldId}`] ?? 0;
          return acc;
        }, {});
        return {
          date: dateKey,
          completed: item?.completed ?? 0,
          totalCompleted: item?.totalCompleted ?? getLastKnownTotal(dateKey),
          xLabel: new Date(`${dateKey}T00:00:00`).toLocaleDateString('it-IT', { day: '2-digit' }),
          ...byField
        };
      });
      setChartData(monthItems);
      return;
    }

    setChartData([]);
  }, [dailyHistory, selectedMonth]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const completedInDay = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
      return (
        <div className="trend-tooltip">
          <p className="tooltip-date">{formatDate(payload[0].payload.date)}</p>
          <p className="tooltip-value">Completati nel giorno: {completedInDay}</p>
          {(trainingPlan.competenceFields || []).map((field) => {
            const value = payload[0].payload[`field_${field.id}`] || 0;
            return (
              <p key={field.id} className="tooltip-completed">
                Campo {field.id}: {value}
              </p>
            );
          })}
          {payload[0].payload.totalCompleted !== undefined && (
            <p className="tooltip-completed">Totale completati: {payload[0].payload.totalCompleted}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!history || history.length === 0) {
    return (
      <div className="trend-empty">
        <Activity size={48} style={{ opacity: 0.3 }} />
        <p>Nessun dato storico disponibile</p>
        <p className="trend-empty-hint">I progressi verranno tracciati automaticamente</p>
      </div>
    );
  }

  return (
    <div className="progress-trend-container">
      <div className="trend-header">
        <h3 className="trend-title">
          <TrendingUp size={20} />
          Andamento Obiettivi Completati
        </h3>
        <div className="trend-controls">
          <select
            className="trend-select"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {availableMonths.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="trend-chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis 
              dataKey="xLabel"
              stroke="var(--text-secondary)"
            />
            <YAxis 
              stroke="var(--text-secondary)"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {(trainingPlan.competenceFields || []).map((field) => (
              <Bar
                key={field.id}
                dataKey={`field_${field.id}`}
                stackId="completedByField"
                fill={FIELD_COLORS[field.id] || '#3b82f6'}
                maxBarSize={36}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-legend">
        {(trainingPlan.competenceFields || []).map((field) => (
          <div key={field.id} className="trend-legend-item">
            <span className="trend-legend-dot" style={{ backgroundColor: FIELD_COLORS[field.id] || '#3b82f6' }} />
            <span>Campo {field.id}</span>
          </div>
        ))}
      </div>

      {stats && (
        <div className="trend-stats">
          {stats.fastestField && (
            <div className="trend-stat-card">
              <TrendingUp size={20} />
              <div>
                <div className="stat-label">Campo con maggior crescita</div>
                <div className="stat-value">{stats.fastestField.field}</div>
                <div className="stat-hint">
                  +{stats.fastestField.growth}% recentemente
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressTrendChart;
