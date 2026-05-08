import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Users, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translate } from '../i18n';
import { trainingPlan } from '../data/trainingPlan';
import { getStudentsByTrainer, getStudentsByInspector, getAllUsers } from '../data/users.supabase';
import { saveAllProgress, loadAllProgress } from '../data/progress.supabase';
import { supabase } from '../supabaseClient';
import { saveCommentFile } from '../data/files';
import { saveProgressSnapshot, clearProgressHistory } from '../data/progress_history.supabase';
import { createNotification, resetStudentApprovals, getAllNotifications } from '../data/notifications.supabase';
import { getTrainerForStudent } from '../data/users.supabase';
import { showDesktopNotification } from '../utils/desktopNotification';
import SideMenu from '../components/SideMenu';
import ProfileSection from '../components/ProfileSection';
import ProgressSection from '../components/ProgressSection';
import ObjectivesSection from '../components/ObjectivesSection';
import GradingSection from '../components/GradingSection';
import SettingsSection from '../components/SettingsSection';
import InboxSection from '../components/InboxSection';
import ManageSection from '../components/ManageSection';

// Impostazioni utente (localStorage — preferenze per dispositivo)
const loadUserSettings = (userId) => {
  try { return JSON.parse(localStorage.getItem('userSettings') || '{}')[userId] || null; } catch { return null; }
};
const saveUserSettings = (userId, settings) => {
  try {
    const all = JSON.parse(localStorage.getItem('userSettings') || '{}');
    localStorage.setItem('userSettings', JSON.stringify({ ...all, [userId]: settings }));
  } catch { }
};
import SearchSection from '../components/SearchSection';
import ExportSection from '../components/ExportSection';
import ProgressTrendChart from '../components/ProgressTrendChart';
import CourseDetailScreen from './CourseDetailScreen';

const normalizeObjectiveSteps = (steps = {}) => ({
  spiegato: Boolean(steps.spiegato),
  esercitato: Boolean(steps.esercitato),
  autonomo: Boolean(steps.autonomo)
});

const isObjectiveCompletedFromSteps = (steps = {}) => {
  const normalized = normalizeObjectiveSteps(steps);
  const allThreeCompleted = normalized.spiegato && normalized.esercitato && normalized.autonomo;
  const hasAutonomousCompleted = normalized.autonomo;
  return allThreeCompleted || hasAutonomousCompleted;
};

const getDefaultStartView = (role) => role === 'admin' ? 'manage' : 'dashboard';

const buildDefaultUserSettings = (role) => ({
  notifications: true,
  startView: getDefaultStartView(role),
  showOnlyIncompleteObjectives: false,
  autoOpenCommentedObjectives: true,
  compactMode: false,
  reducedMotion: false,
  rememberSelectedStudent: true,
  lastSelectedStudentId: null
});

const DashboardScreen = ({ 
  currentUser, 
  onLogout,
  darkMode,
  onDarkModeChange,
  language,
  onLanguageChange
}) => {
  const userRole = currentUser.role;
  const isTrainer = userRole === 'trainer';
  const isAdmin = userRole === 'admin';
  const isInspector = userRole === 'inspector';
  const isReadOnly = isInspector;
  const canSelectStudents = isTrainer || isAdmin || isInspector;
  const t = (key) => translate(key, language);
  const availableStartViews = [
    { value: 'dashboard', label: t('menu.dashboard') },
    { value: 'objectives', label: t('objectives.title') },
    { value: 'grading', label: t('grading.title') },
    { value: 'statistics', label: t('progress.title') },
    { value: 'search', label: t('search.title') },
    { value: 'export', label: t('export.title') },
    ...(isAdmin ? [{ value: 'manage', label: t('manage.title') }] : []),
    ...(!isAdmin ? [{ value: 'inbox', label: t('inbox.title') }] : []),
    { value: 'settings', label: t('menu.settings') }
  ];
  const allowedStartViewIds = availableStartViews.map((view) => view.value);
  const isAllowedStartView = (view) => allowedStartViewIds.includes(view);
  
  // Per il formatore: gestione selezione apprendista
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [liveCurrentUser, setLiveCurrentUser] = useState(currentUser);
  const [userSettings, setUserSettings] = useState(() => buildDefaultUserSettings(userRole));
  const [currentView, setCurrentView] = useState(getDefaultStartView(userRole));
  const [objectiveFocus, setObjectiveFocus] = useState(null);
  const [courseDetailItem, setCourseDetailItem] = useState(null);
  const [courseDetailType, setCourseDetailType] = useState(null);
  const [completedObjectives, setCompletedObjectives] = useState({});
  const [objectiveSteps, setObjectiveSteps] = useState({});
  const [objectiveComments, setObjectiveComments] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setUserSettings(buildDefaultUserSettings(userRole));
      setCurrentView(getDefaultStartView(userRole));
      return;
    }

    const savedSettings = loadUserSettings(currentUser.id) || {};
    const mergedSettings = {
      ...buildDefaultUserSettings(userRole),
      ...savedSettings
    };
    const normalizedStartView = isAllowedStartView(mergedSettings.startView)
      ? mergedSettings.startView
      : getDefaultStartView(userRole);

    setUserSettings({
      ...mergedSettings,
      startView: normalizedStartView
    });
    setCurrentView(normalizedStartView);
  }, [currentUser, isAdmin, userRole]);

  useEffect(() => {
    document.body.classList.toggle('compact-mode', Boolean(userSettings.compactMode));
    document.body.classList.toggle('reduced-motion', Boolean(userSettings.reducedMotion));

    return () => {
      document.body.classList.remove('compact-mode');
      document.body.classList.remove('reduced-motion');
    };
  }, [userSettings.compactMode, userSettings.reducedMotion]);

  const handleUserSettingsChange = (updates) => {
    if (!currentUser?.id) return;

    setUserSettings((prev) => {
      const nextSettings = {
        ...prev,
        ...updates
      };
      const normalizedStartView = isAllowedStartView(nextSettings.startView)
        ? nextSettings.startView
        : getDefaultStartView(userRole);
      const normalizedSettings = {
        ...nextSettings,
        startView: normalizedStartView
      };

      saveUserSettings(currentUser.id, normalizedSettings);
      return normalizedSettings;
    });
  };
  
  useEffect(() => {
    if (!currentUser) {
      setLiveCurrentUser(null);
      return;
    }

    if (canSelectStudents) {
      setLiveCurrentUser(currentUser);
      return;
    }

    const refreshUser = async () => {
      const allUsers = await getAllUsers();
      const latestUser = allUsers.find((user) => user.id === currentUser.id) || currentUser;
      setLiveCurrentUser(latestUser);
    };
    refreshUser();
  }, [canSelectStudents, currentUser]);

  // Per lo studente: usa dati aggiornati da storage
  const activeUser = canSelectStudents ? selectedStudent : liveCurrentUser;
  const studentName = activeUser?.name || '';
  const studentNumber = activeUser?.studentNumber || '';
  const formationYear = activeUser?.formationYear || null;
  const apprenticeshipStart = activeUser?.apprenticeshipStart || '';
  const apprenticeshipEnd = activeUser?.apprenticeshipEnd || '';

  // Ref per currentUser sempre aggiornato — usato nelle subscription
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Carica il conteggio notifiche non lette da Supabase
  const loadUnreadCount = React.useCallback(async () => {
    if (!currentUser?.id) { setNotifications([]); return; }
    try {
      const all = await getAllNotifications();
      const mine = all.filter(n => n.user_id === currentUser.id);
      setNotifications(mine);
    } catch {
      // ignora errori di rete transitori
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Subscription globale notifiche — sempre attiva indipendentemente dalla vista corrente
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel('dashboard-notifications-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const incomingUserId = parseInt(payload.new?.user_id, 10);
        const myId = parseInt(currentUserRef.current?.id, 10);
        if (incomingUserId === myId) {
          // Aggiorna badge
          setNotifications((prev) => [...prev, {
            id: payload.new.id,
            user_id: payload.new.user_id,
            read: payload.new.read || false,
          }]);
          // Notifica push desktop
          const title = payload.new.title || 'Monitor Formazione';
          const body = payload.new.sender_name || '';
          showDesktopNotification(title, body);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        loadUnreadCount();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, () => {
        loadUnreadCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, loadUnreadCount]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;


  // Ref per leggere userSettings dentro useEffect senza aggiungerli alle dipendenze
  const userSettingsRef = React.useRef(userSettings);
  useEffect(() => { userSettingsRef.current = userSettings; }, [userSettings]);

  // Carica la lista degli apprendisti per il formatore
  useEffect(() => {
    if (!canSelectStudents) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }
    const loadStudents = async () => {
      const studentsList = isTrainer
        ? await getStudentsByTrainer(currentUser.id)
        : isInspector
          ? await getStudentsByInspector(currentUser.id)
          : (await getAllUsers()).filter((user) => user.role === 'student');
      setStudents(studentsList);
      if (studentsList.length === 0) {
        setSelectedStudent(null);
        return;
      }
      // Leggo i settings dal ref per evitare loop: le preferenze non devono
      // ritriggerare il caricamento degli studenti
      const { rememberSelectedStudent, lastSelectedStudentId } = userSettingsRef.current;
      const preferredStudentId = rememberSelectedStudent ? lastSelectedStudentId : null;
      const preferredStudent = studentsList.find((student) => student.id === preferredStudentId);
      setSelectedStudent(preferredStudent || studentsList[0]);
    };
    loadStudents();
  }, [canSelectStudents, currentUser, isInspector, isTrainer]);

  useEffect(() => {
    if (!canSelectStudents || !currentUser?.id || !selectedStudent || !userSettings.rememberSelectedStudent) {
      return;
    }

    if (userSettings.lastSelectedStudentId === selectedStudent.id) {
      return;
    }

    handleUserSettingsChange({ lastSelectedStudentId: selectedStudent.id });
  }, [selectedStudent]);

  // Carica il progresso dell'apprendista selezionato
  useEffect(() => {
    if (!activeUser) return;

    const applyProgressData = ({ completedObjectives: progress, objectiveSteps: savedSteps, objectiveComments: savedComments }) => {
      const normalizedSteps = {};
      Object.entries(savedSteps || {}).forEach(([objectiveId, steps]) => {
        normalizedSteps[objectiveId] = normalizeObjectiveSteps(steps);
      });

      const hasSavedSteps = Object.keys(normalizedSteps).length > 0;
      if (!hasSavedSteps) {
        Object.entries(progress || {}).forEach(([objectiveId, isCompleted]) => {
          if (isCompleted) {
            normalizedSteps[objectiveId] = {
              spiegato: false,
              esercitato: false,
              autonomo: true
            };
          }
        });
        if (Object.keys(normalizedSteps).length > 0) {
          saveAllProgress(activeUser.id, { objectiveSteps: normalizedSteps }).catch(console.error);
        }
      }

      const derivedProgress = { ...progress };
      Object.entries(normalizedSteps).forEach(([objectiveId, steps]) => {
        derivedProgress[objectiveId] = isObjectiveCompletedFromSteps(steps);
      });

      setObjectiveSteps(normalizedSteps);
      setCompletedObjectives(derivedProgress);
      setObjectiveComments(savedComments || {});
    };

    const loadData = async () => {
      const data = await loadAllProgress(activeUser.id);
      applyProgressData(data);
    };
    loadData().catch(console.error);

    // Real-time: ricarica quando un altro client salva
    const channel = supabase
      .channel(`progress-${activeUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'progress',
        filter: `student_id=eq.${parseInt(activeUser.id, 10)}`
      }, () => {
        loadAllProgress(activeUser.id).then(applyProgressData).catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUser]);

  // Salva snapshot del progresso per tracking storico
  useEffect(() => {
    if (activeUser && Object.keys(completedObjectives).length > 0) {
      const totalObj = getTotalObjectives();
      const completedObj = getCompletedObjectives();
      const overallPercent = totalObj > 0 ? ((completedObj / totalObj) * 100).toFixed(1) : 0;
      const fieldProgressData = getAllFieldProgress();
      
      const fieldProgress = {};
      const fieldCompleted = {};
      const fieldTotals = {};
      fieldProgressData.forEach(({ field, progress }) => {
        fieldProgress[field.id] = progress.percentage;
        fieldCompleted[field.id] = progress.completed;
        fieldTotals[field.id] = progress.total;
      });
      
      const activeObj = Object.values(completedObjectives).filter(v => v === false).length;
      
      saveProgressSnapshot(activeUser.id, {
        overallProgress: overallPercent,
        fieldProgress: fieldProgress,
        fieldCompleted,
        fieldTotals,
        completedObjectives: completedObj,
        totalObjectives: totalObj,
        activeObjectives: activeObj
      }).then(() => {
        window.dispatchEvent(new Event('progress-history-updated'));
      }).catch(console.error);
    }
  }, [activeUser, completedObjectives]);

  const handleUpdateObjectiveStep = (objectiveId, step, value) => {
    if (!activeUser || isReadOnly) return;

    const previousSteps = normalizeObjectiveSteps(objectiveSteps[objectiveId]);
    const newObjectiveSteps = {
      ...previousSteps,
      [step]: Boolean(value)
    };

    const newSteps = {
      ...objectiveSteps,
      [objectiveId]: newObjectiveSteps
    };

    const wasCompleted = isObjectiveCompletedFromSteps(previousSteps);
    const isCompletedNow = isObjectiveCompletedFromSteps(newObjectiveSteps);

    const newProgress = {
      ...completedObjectives,
      [objectiveId]: isCompletedNow
    };

    if (!wasCompleted && isCompletedNow && !isTrainer) {
      showDesktopNotification(
        t('notification.objectiveCompleted'),
        `${t('notification.objectiveCompletedBody')} ${objectiveId}`
      );
      getTrainerForStudent(activeUser.id).then((trainer) => {
        if (trainer) {
          createNotification(trainer.id, activeUser.name, objectiveId, 'completion', activeUser.id).catch(console.error);
        }
      }).catch(console.error);
    }

    setObjectiveSteps(newSteps);
    setCompletedObjectives(newProgress);
    // Il salvataggio avviene manualmente col pulsante Salva
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProgress = async () => {
    if (!activeUser) return;
    setIsSaving(true);
    try {
      await saveAllProgress(activeUser.id, { completedObjectives, objectiveSteps });
    } catch (e) {
      console.error('Errore salvataggio progresso:', e);
      alert('Errore durante il salvataggio. Controlla la connessione.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetProgress = () => {
    if (!activeUser || isReadOnly) return;
    
    setCompletedObjectives({});
    setObjectiveSteps({});
    setObjectiveComments({});
    saveAllProgress(activeUser.id, { completedObjectives: {}, objectiveSteps: {}, objectiveComments: {} }).catch(console.error);
    clearProgressHistory(activeUser.id).catch(console.error);
    resetStudentApprovals(activeUser.id).catch(console.error);
    window.dispatchEvent(new Event('progress-history-updated'));
  };

  const handleCommentChange = (objectiveId, commentType, value) => {
    if (!activeUser || isReadOnly) return;
    
    const newComments = {
      ...objectiveComments,
      [objectiveId]: {
        ...objectiveComments[objectiveId],
        [commentType]: value
      }
    };
    
    setObjectiveComments(newComments);
    saveAllProgress(activeUser.id, { objectiveComments: newComments }).catch(console.error);
  };

  const handleAttachFile = async (objectiveId, file) => {
    if (!activeUser || !file || isReadOnly) return;
    const result = await saveCommentFile(file);
    if (!result || !result.success) return;

    const existing = objectiveComments[objectiveId] || {};
    const attachments = existing.attachments ? [...existing.attachments] : [];
    attachments.push({ name: result.name, url: result.url });

    const newComments = {
      ...objectiveComments,
      [objectiveId]: {
        ...existing,
        attachments
      }
    };

    setObjectiveComments(newComments);
    saveAllProgress(activeUser.id, { objectiveComments: newComments }).catch(console.error);
  };

  const handleRemoveAttachment = (objectiveId, index) => {
    if (!activeUser || isReadOnly) return;
    const existing = objectiveComments[objectiveId] || {};
    const attachments = existing.attachments ? [...existing.attachments] : [];
    if (index < 0 || index >= attachments.length) return;
    attachments.splice(index, 1);

    const newComments = {
      ...objectiveComments,
      [objectiveId]: {
        ...existing,
        attachments
      }
    };

    setObjectiveComments(newComments);
    saveAllProgress(activeUser.id, { objectiveComments: newComments }).catch(console.error);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handlePasswordChange = (newPassword) => {
    if (currentUser) {
      currentUser.password = newPassword;
    }
  };

  const handleNavigation = (view, courseItem = null, courseType = null) => {
    setCurrentView(view);
    if (view !== 'objectives') {
      setObjectiveFocus(null);
    }
    if (view === 'course-detail') {
      setCourseDetailItem(courseItem);
      setCourseDetailType(courseType);
    } else {
      setCourseDetailItem(null);
      setCourseDetailType(null);
    }
  };

  const handleSearchNavigate = (view, focus = null) => {
    setCurrentView(view);
    setObjectiveFocus(view === 'objectives' ? focus : null);
  };

  // Varianti per le animazioni delle sezioni
  const sectionVariants = {
    hidden: userSettings.reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: userSettings.reducedMotion ? 0 : 0.4,
        ease: "easeOut",
        staggerChildren: userSettings.reducedMotion ? 0 : 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: userSettings.reducedMotion ? 0 : -20,
      scale: userSettings.reducedMotion ? 1 : 0.95,
      transition: { duration: userSettings.reducedMotion ? 0 : 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Calcola statistiche
  const getTotalObjectives = () => {
    let total = 0;
    trainingPlan.competenceFields.forEach(field => {
      field.competencies.forEach(comp => {
        total += comp.objectives.length;
      });
    });
    return total;
  };

  const getCompletedObjectives = () => {
    return Object.values(completedObjectives).filter(Boolean).length;
  };

  const getFieldProgress = (fieldId) => {
    let total = 0;
    let completed = 0;
    const field = trainingPlan.competenceFields.find(f => f.id === fieldId);
    if (field) {
      field.competencies.forEach(comp => {
        comp.objectives.forEach(obj => {
          total += 1;
          if (completedObjectives[obj.id]) completed += 1;
        });
      });
    }
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getAllFieldProgress = () => {
    return trainingPlan.competenceFields.map((field) => ({
      field,
      progress: getFieldProgress(field.id)
    }));
  };

  // Sezione Statistiche
  const StatisticsSection = () => {
    const totalObj = getTotalObjectives();
    const completedObj = getCompletedObjectives();
    const overallPercent = totalObj > 0 ? Math.round((completedObj / totalObj) * 100) : 0;
    const remainingObj = Math.max(0, totalObj - completedObj);
    const fieldProgressData = getAllFieldProgress();
    const completedFields = fieldProgressData.filter(({ progress }) => progress.percentage === 100).length;
    const activeFields = fieldProgressData.filter(({ progress }) => progress.percentage > 0 && progress.percentage < 100).length;
    const averageFieldProgress = fieldProgressData.length > 0
      ? Math.round(fieldProgressData.reduce((acc, item) => acc + item.progress.percentage, 0) / fieldProgressData.length)
      : 0;
    const sortedFields = [...fieldProgressData].sort((a, b) => b.progress.percentage - a.progress.percentage);
    const bestField = sortedFields[0];
    const leastAdvancedField = [...sortedFields].reverse()[0];

    return (
      <section className="statistics-section">
        <div className="section-title">Statistiche di Progresso</div>

        <div className="overall-progress-card">
          <div className="overall-progress-header">
            <h3>Progresso complessivo</h3>
            <span className="overall-progress-value">{overallPercent}%</span>
          </div>
          <div className="overall-progress-bar">
            <div className="overall-progress-fill" style={{ width: `${overallPercent}%` }} />
          </div>
          <div className="overall-progress-meta">
            <span>{completedObj} completati</span>
            <span>{remainingObj} rimanenti</span>
            <span>Media campi: {averageFieldProgress}%</span>
          </div>
        </div>
        
        <div className="statistics-grid">
          <motion.div 
            className="stat-card"
            variants={itemVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Progresso Totale</p>
              <p className="stat-value">{overallPercent}%</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            variants={itemVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
              <BookOpen size={24} color="white" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Obiettivi Completati</p>
              <p className="stat-value">{completedObj}/{totalObj}</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            variants={itemVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
              <Users size={24} color="white" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Campi di Competenza</p>
              <p className="stat-value">{completedFields}/{fieldProgressData.length}</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            variants={itemVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
              <Target size={24} color="white" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Obiettivi Rimanenti</p>
              <p className="stat-value">{remainingObj}</p>
            </div>
          </motion.div>
        </div>

        <div className="stats-highlight-row">
          <div className="stats-highlight-card">
            <p className="stats-highlight-label">Campo più avanzato</p>
            <p className="stats-highlight-value">
              {bestField ? `${bestField.field.id} (${bestField.progress.percentage}%)` : 'N/A'}
            </p>
          </div>
          <div className="stats-highlight-card">
            <p className="stats-highlight-label">Campo meno avanzato</p>
            <p className="stats-highlight-value">
              {leastAdvancedField ? `${leastAdvancedField.field.id} (${leastAdvancedField.progress.percentage}%)` : 'N/A'}
            </p>
          </div>
          <div className="stats-highlight-card">
            <p className="stats-highlight-label">Campi in lavorazione</p>
            <p className="stats-highlight-value">{activeFields}</p>
          </div>
        </div>

        <div className="fields-progress">
          <h3 className="progress-title">Progresso per Campo di Competenza</h3>
          <div className="fields-grid">
            {fieldProgressData.map(({ field, progress }, index) => {
              return (
                <motion.div 
                  key={field.id} 
                  className="field-progress-card"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="field-header-stat">
                    <h4>{field.id} - {field.name}</h4>
                    <span className="stats-progress-badge">{progress.percentage}%</span>
                  </div>
                  <div className="stats-progress-bar-container">
                    <div className="stats-progress-bar">
                      <div 
                        className="stats-progress-fill" 
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="stats-progress-text">
                    {progress.completed} di {progress.total} obiettivi · {Math.max(0, progress.total - progress.completed)} rimanenti
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <ProgressTrendChart
          userId={activeUser?.id}
          totalObjectives={totalObj}
          language={language}
          apprenticeshipStart={activeUser?.apprenticeshipStart}
          apprenticeshipEnd={activeUser?.apprenticeshipEnd}
        />
      </section>
    );
  };

  return (
    <div className="dashboard-screen">
      <SideMenu 
        isOpen={true} 
        onLogout={onLogout}
        onNavigate={handleNavigation}
        currentView={currentView}
        language={language}
        isTrainer={isTrainer}
        isAdmin={isAdmin}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-logo-fixed">
            <img src="./Logo%20CERDD%20TI.png" alt="CERDD Logo" style={{ height: '60px', width: 'auto' }} />
          </div>

        {canSelectStudents && students.length > 0 && currentView !== 'settings' && currentView !== 'manage' && (
          <div className="student-selector-section">
            <div className="section-title">{t('trainer.selectStudent')}</div>
            <div className="student-selector">
              {students.map((student) => (
                <button
                  key={student.id}
                  className={`student-button ${selectedStudent?.id === student.id ? 'active' : ''}`}
                  onClick={() => handleStudentSelect(student)}
                >
                  <Users size={18} />
                  <span>{student.name}</span>
                  {selectedStudent?.id === student.id && <span className="active-indicator">●</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {currentView === 'dashboard' && activeUser && (
              <>
                <ProfileSection
                  studentName={studentName}
                  studentNumber={studentNumber}
                  formationYear={formationYear}
                  apprenticeshipStart={apprenticeshipStart}
                  apprenticeshipEnd={apprenticeshipEnd}
                  language={language}
                />
                <ProgressSection
                  completedObjectives={completedObjectives}
                  language={language}
                />
              </>
            )}

            {currentView === 'statistics' && (
              <StatisticsSection />
            )}

            {currentView === 'objectives' && activeUser && (
              <ObjectivesSection
                completedObjectives={completedObjectives}
                objectiveSteps={objectiveSteps}
                onUpdateObjectiveStep={handleUpdateObjectiveStep}
                onSave={handleSaveProgress}
                isSaving={isSaving}
                language={language}
                userRole={userRole}
                isTrainer={isTrainer}
                isReadOnly={isReadOnly}
                studentId={activeUser.id}
                comments={objectiveComments}
                onCommentChange={handleCommentChange}
                onAttachFile={handleAttachFile}
                onRemoveAttachment={handleRemoveAttachment}
                objectiveFocus={objectiveFocus}
                preferences={{
                  showOnlyIncompleteObjectives: userSettings.showOnlyIncompleteObjectives,
                  autoOpenCommentedObjectives: userSettings.autoOpenCommentedObjectives,
                  reducedMotion: userSettings.reducedMotion
                }}
              />
            )}

            {currentView === 'grading' && activeUser && (
              <GradingSection
                studentId={activeUser.id}
                language={language}
                userRole={userRole}
                isTrainer={isTrainer}
                isReadOnly={isReadOnly}
                onNavigate={handleNavigation}
              />
            )}

            {currentView === 'course-detail' && activeUser && courseDetailItem && (
              <CourseDetailScreen
                item={courseDetailItem}
                itemType={courseDetailType}
                studentId={activeUser.id}
                language={language}
                userRole={userRole}
                isTrainer={isTrainer}
                isReadOnly={isReadOnly}
                onBack={() => handleNavigation('grading')}
              />
            )}

            {currentView === 'grading' && !activeUser && (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ fontSize: '1.2em' }}>
                  {language === 'it' ? 'Seleziona uno studente per visualizzare le valutazioni' :
                   language === 'en' ? 'Select a student to view grades' :
                   language === 'de' ? 'Wählen Sie einen Studenten aus, um Noten anzuzeigen' :
                   'Sélectionnez un étudiant pour voir les évaluations'}
                </p>
              </div>
            )}

            {currentView === 'search' && (
              <SearchSection
                currentUser={currentUser}
                language={language}
                progress={completedObjectives}
                comments={objectiveComments}
                notifications={notifications}
                onNavigate={handleSearchNavigate}
              />
            )}

            {currentView === 'settings' && (
              <SettingsSection
                onResetProgress={handleResetProgress}
                language={language}
                onLanguageChange={onLanguageChange}
                userRole={userRole}
                isReadOnly={isReadOnly}
                currentUser={currentUser}
                onPasswordChange={handlePasswordChange}
                completedObjectives={completedObjectives}
                selectedStudent={selectedStudent}
                students={students}
                onStudentSelect={setSelectedStudent}
                userSettings={userSettings}
                onUserSettingsChange={handleUserSettingsChange}
                availableStartViews={availableStartViews}
              />
            )}

            {currentView === 'inbox' && (
              <InboxSection
                language={language}
                currentUser={currentUser}
                selectedStudent={selectedStudent}
                isTrainer={isTrainer}
                isReadOnly={isReadOnly}
                onNotificationsUpdated={loadUnreadCount}
              />
            )}

            {currentView === 'export' && activeUser && (
              <ExportSection
                studentName={studentName}
                studentNumber={studentNumber}
                formationYear={formationYear}
                completedObjectives={completedObjectives}
                objectiveSteps={objectiveSteps}
                language={language}
              />
            )}

            {currentView === 'export' && !activeUser && (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ fontSize: '1.2em' }}>
                  {language === 'it' ? 'Seleziona uno studente per esportare i report' :
                   language === 'en' ? 'Select a student to export reports' :
                   language === 'de' ? 'Wählen Sie einen Studenten aus, um Berichte zu exportieren' :
                   'Sélectionnez un étudiant pour exporter les rapports'}
                </p>
              </div>
            )}

            {currentView === 'manage' && isAdmin && (
              <ManageSection
                language={language}
                currentUser={currentUser}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
