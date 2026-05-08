import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { translate } from '../i18n';
import { loadGrades, getAllGrades, addGrade, updateGrade, deleteGrade } from '../data/grades.supabase';
import { getAllModules, loadModuleTests, saveModuleTest, updateModuleTest, deleteModuleTest, getModuleAverage } from '../data/grades';
import { supabase } from '../supabaseClient';

const GradingSection = ({ studentId, language = 'it', userRole = 'student', isTrainer = false, isReadOnly = false, onNavigate }) => {
  const t = (key) => translate(key, language);
  const [grades, setGrades] = useState([]);
  const [editingGrade, setEditingGrade] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({
    subject: 'cultureGeneral',
    grade: '',
    studentComment: '',
    trainerComment: ''
  });
  
  // Module tests state
  const [modules, setModules] = useState([]);
  const [moduleTests, setModuleTests] = useState({});
  const [editingTest, setEditingTest] = useState(null);
  const [testFormData, setTestFormData] = useState({
    score: '',
    comments: ''
  });

  // Form visibility state
  const [showGradeFormForSubject, setShowGradeFormForSubject] = useState(null);
  const [showGradeFormForModule, setShowGradeFormForModule] = useState(null);
  const [showTestForm, setShowTestForm] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (studentId) {
      loadStudentGrades();
      loadModulesAndTests();
    }

    const channel = supabase
      .channel(`grades-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => {
        loadStudentGrades();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const loadStudentGrades = async () => {
    try {
      const studentGrades = await loadGrades(studentId);
      setGrades(studentGrades.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      setGrades([]);
      console.error('Errore caricamento voti da Supabase:', error);
    }
  };

  const loadModulesAndTests = () => {
    const allModules = getAllModules();
    setModules(allModules);
    
    const tests = {};
    allModules.forEach(moduleId => {
      tests[moduleId] = loadModuleTests(studentId, moduleId);
    });
    setModuleTests(tests);
  };

  const handleSaveGrade = async (payload, editingItem = null) => {
    const gradeValue = payload.grade;
    if (gradeValue === '' || gradeValue === null || gradeValue === undefined || Number(gradeValue) < 0 || Number(gradeValue) > 6) {
      alert(t('grading.gradeRange') || 'Grade must be between 0 and 6');
      return;
    }
    try {
      if (editingItem) {
        await updateGrade({ ...editingItem, ...payload });
      } else {
        await addGrade({ ...payload, studentId });
      }
      await loadStudentGrades();
      setEditingGrade(null);
      setGradeFormData({
        subject: 'cultureGeneral',
        grade: '',
        studentComment: '',
        trainerComment: ''
      });
    } catch (error) {
      alert('Errore durante il salvataggio del voto: ' + error.message);
    }
  };

  const handleEditGrade = (grade, subjectKey) => {
    setEditingGrade(grade);
    setGradeFormData({
      subject: grade.subject || subjectKey,
      grade: grade.grade.toString(),
      studentComment: grade.studentComment,
      trainerComment: grade.trainerComment
    });
    setShowGradeFormForSubject(subjectKey);
  };

  const handleDeleteGrade = async (gradeId) => {
    if (window.confirm(t('grading.confirmDelete'))) {
      try {
        await deleteGrade(gradeId);
        await loadStudentGrades();
      } catch (error) {
        alert('Errore durante l\'eliminazione del voto: ' + error.message);
      }
    }
  };

  const resetGradeForm = () => {
    setGradeFormData({ subject: 'cultureGeneral', grade: '', studentComment: '', trainerComment: '' });
    setEditingGrade(null);
  };

  const toggleGradeForm = (subjectKey) => {
    if (showGradeFormForSubject === subjectKey) {
      setShowGradeFormForSubject(null);
      resetGradeForm();
    } else {
      setShowGradeFormForSubject(subjectKey);
      resetGradeForm();
      setGradeFormData(prev => ({ ...prev, subject: subjectKey }));
    }
  };

  const toggleTestForm = (moduleId) => {
    if (showTestForm === moduleId) {
      setShowTestForm(null);
      resetTestForm();
    } else {
      setShowTestForm(moduleId);
      resetTestForm();
    }
  };

  const renderGradeItem = (grade) => (
    <div key={grade.id} className="grade-item">
      <div className="grade-header">
        <div className="grade-info">
          <div className="stars">{renderStars(Math.round(grade.grade))}</div>
          <span className="grade-value">{grade.grade}</span>
          <span className="grade-date">
            {new Date(grade.date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : 'fr-FR')}
          </span>
        </div>
        {canEdit && (
          <div className="grade-actions">
            <button onClick={() => handleEditGrade(grade)}>
              <Edit size={14} />
            </button>
            <button onClick={() => handleDeleteGrade(grade.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {grade.studentComment && (
        <div className="comment-block">
          <div className="comment-label">
            <MessageSquare size={14} />
            {t('grading.studentComment')}
          </div>
          <p className="comment-text">{grade.studentComment}</p>
        </div>
      )}

      {grade.trainerComment && (
        <div className="comment-block">
          <div className="comment-label">
            <MessageSquare size={14} />
            {t('grading.trainerComment')}
          </div>
          <p className="comment-text">{grade.trainerComment}</p>
        </div>
      )}
    </div>
  );

  // Module test functions
  const handleSaveTest = (moduleId, payload, editingItem = null) => {
    const scoreValue = payload.score;
    if (scoreValue === '' || scoreValue === null || scoreValue === undefined || Number(scoreValue) < 0 || Number(scoreValue) > 6) {
      alert(t('moduleTests.scoreRange') || 'Score must be between 0 and 6');
      return;
    }

    if (editingItem) {
      updateModuleTest(studentId, moduleId, editingItem.id, payload);
    } else {
      saveModuleTest(studentId, moduleId, payload);
    }

    loadModulesAndTests();
  };

  const handleEditTest = (moduleId, test) => {
    setEditingTest({ ...test, moduleId });
    setTestFormData({
      comments: test.comments,
      score: test.score !== undefined && test.score !== null ? test.score.toString() : ''
    });
    setShowTestForm(moduleId);
  };

  const handleDeleteTest = (moduleId, testId) => {
    if (window.confirm(t('moduleTests.confirmDelete'))) {
      deleteModuleTest(studentId, moduleId, testId);
      loadModulesAndTests();
    }
  };

  const resetTestForm = () => {
    setTestFormData({ comments: '', score: '' });
    setEditingTest(null);
    setShowTestForm(null);
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const subjects = [
    { key: 'cultureGeneral', label: t('subjectGrades.cultureGeneral') },
    { key: 'english', label: t('subjectGrades.english') }
  ];

  const getGradesBySubject = (subjectKey) => grades.filter((grade) => grade.subject === subjectKey);

  const getSubjectAverage = (subjectKey) => {
    const subjectGrades = getGradesBySubject(subjectKey)
      .map((grade) => Number(grade.grade))
      .filter((value) => !Number.isNaN(value));
    if (subjectGrades.length === 0) return null;
    return (subjectGrades.reduce((acc, value) => acc + value, 0) / subjectGrades.length).toFixed(1);
  };

  const sanitizeNumericInput = (value) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const [integer, ...decimals] = sanitized.split('.');
    return decimals.length ? `${integer}.${decimals.join('')}` : integer;
  };

  const getTotalAverage = () => {
    const validGrades = grades.map(g => Number(g.grade)).filter(v => !isNaN(v));
    if (validGrades.length === 0) return null;
    return (validGrades.reduce((acc, v) => acc + v, 0) / validGrades.length).toFixed(1);
  };

  const totalAverage = getTotalAverage();

  const getUnassignedGrades = () => grades.filter((grade) => !subjects.some((subject) => subject.key === grade.subject));

  const canEdit = !isReadOnly && ((userRole === 'student' && !isTrainer) || isTrainer);

  const handleOpenSubjectModal = (subject) => {
    onNavigate('course-detail', subject, 'subject');
  };

  const handleOpenModuleModal = (moduleId) => {
    onNavigate('course-detail', moduleId, 'module');
  };

  const renderStars = (grade) => {
    const stars = [];
    for (let i = 1; i <= 6; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= grade ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
        />
      );
    }
    return stars;
  };

  return (
    <div className="grading-section">
      <div className="section-header">
        <div>
          <h2>{t('grading.title')}</h2>
          <p className="section-subtitle">{t('grading.subtitle') || 'Panoramica valutazioni'}</p>
        </div>
        {totalAverage && (
          <div className="average-grade">
            <span className="average-label">{t('grading.average')}</span>
            <span className="average-value">{totalAverage}</span>
            <div className="stars">{renderStars(Math.round(parseFloat(totalAverage)))}</div>
          </div>
        )}
      </div>

      <div className="grading-cards-grid">
        {/* Subject Cards */}
        {subjects.map((subject, index) => {
          const subjectGrades = getGradesBySubject(subject.key);
          const subjectAverage = getSubjectAverage(subject.key);
          const colors = ['#1abc9c', '#16a085', '#3498db', '#2980b9'];
          const bgColor = colors[index % colors.length];
          
          return (
            <div key={subject.key} className="grading-card-container">
              <div 
                className="grading-card clickable-card"
                onClick={() => handleOpenSubjectModal(subject)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header" style={{ backgroundColor: bgColor }}></div>
                <div className="card-content">
                  <h3>{subject.label}</h3>
                  {subjectAverage ? (
                    <div className="card-average">
                      <span className="average-label">{t('grading.average')}</span>
                      <span className="average-value">{subjectAverage}</span>
                      <div className="card-stars">{renderStars(Math.round(parseFloat(subjectAverage)))}</div>
                    </div>
                  ) : (
                    <p className="no-data">{t('subjectGrades.noGrades')}</p>
                  )}
                  {subjectGrades.length > 0 && (
                    <div className="card-meta">
                      <span className="grade-count">{subjectGrades.length} {t('grading.grades') || 'valutazioni'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Grade Button */}
              {canEdit && (
                <button
                  className="add-grade-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGradeForm(subject.key);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--accent-success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  {t('grading.addGrade') || 'Aggiungi Valutazione'}
                </button>
              )}

              {/* Inline Grade Form */}
              {showGradeFormForSubject === subject.key && showGradeFormForModule === null && canEdit && (
                <div className="inline-form" style={{
                  marginTop: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                    {editingGrade ? t('common.edit') || 'Modifica' : t('common.add') || 'Aggiungi'} {t('grading.grade')}
                  </h4>
                  
                  <div className="form-row" style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {t('grading.grade')} (0-6):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      step="0.1"
                      value={gradeFormData.grade}
                      onChange={(e) => setGradeFormData({...gradeFormData, grade: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div className="form-row" style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {t('grading.studentComment')}:
                    </label>
                    <textarea
                      value={gradeFormData.studentComment}
                      onChange={(e) => setGradeFormData({...gradeFormData, studentComment: e.target.value})}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {isTrainer && (
                    <div className="form-row" style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t('grading.trainerComment')}:
                      </label>
                      <textarea
                        value={gradeFormData.trainerComment}
                        onChange={(e) => setGradeFormData({...gradeFormData, trainerComment: e.target.value})}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}

                  <div className="form-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => toggleGradeForm(subject.key)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--secondary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {t('common.cancel') || 'Annulla'}
                    </button>
                    <button
                      onClick={() => {
                        handleSaveGrade(gradeFormData, editingGrade);
                        toggleGradeForm(subject.key);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--success-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Save size={14} style={{ marginRight: '4px' }} />
                      {t('common.save') || 'Salva'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Module Cards */}
        {modules.map((moduleId, index) => {
          const moduleAverage = getModuleAverage(studentId, moduleId);
          const moduleTests_ = moduleTests[moduleId] || [];
          const colors = ['#e74c3c', '#c0392b', '#f39c12', '#d68910'];
          const bgColor = colors[(index + subjects.length) % colors.length];
          
          return (
            <div key={`module-${moduleId}`} className="grading-card-container">
              <div 
                className="grading-card clickable-card"
                onClick={() => handleOpenModuleModal(moduleId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header" style={{ backgroundColor: bgColor }}></div>
                <div className="card-content">
                  <h3>{t('moduleTests.module')} {moduleId}</h3>
                  {moduleAverage ? (
                    <div className="card-average">
                      <span className="average-label">{t('moduleTests.average')}</span>
                      <span className="average-value">{moduleAverage}</span>
                      <div className="card-stars">{renderStars(Math.round(parseFloat(moduleAverage)))}</div>
                    </div>
                  ) : (
                    <p className="no-data">{t('moduleTests.noTests')}</p>
                  )}
                  {moduleTests_.length > 0 && (
                    <div className="card-meta">
                      <span className="test-count">{moduleTests_.length} {t('moduleTests.title').toLowerCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Subject Grade Button (replaces module test add) */}
              {canEdit && (
                <button
                  type="button"
                  className="add-grade-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!subjects || subjects.length === 0) {
                      alert(t('grading.noSubjects') || 'Nessuna materia disponibile');
                      return;
                    }
                    setShowGradeFormForModule(moduleId);
                    setShowGradeFormForSubject(subjects[0].key);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--accent-success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  {t('grading.addGrade') || 'Aggiungi Valutazione'}
                </button>
              )}

              {/* Inline Grade Form for Module */}
              {subjects.map((subject) => {
                if (showGradeFormForSubject === subject.key && showGradeFormForModule === moduleId && canEdit) {
                  return (
                    <div key={`module-grade-form-${moduleId}-${subject.key}`} className="inline-form" style={{
                      marginTop: '12px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                        {editingGrade ? t('common.edit') || 'Modifica' : t('common.add') || 'Aggiungi'} {t('grading.grade')}
                      </h4>
                      
                      <div className="form-row" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {t('grading.subject') || 'Materia'}:
                        </label>
                        <select
                          value={gradeFormData.subject}
                          onChange={(e) => setGradeFormData({...gradeFormData, subject: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {subjects.map((subjectOption) => (
                            <option key={subjectOption.key} value={subjectOption.key}>
                              {subjectOption.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-row" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {t('grading.grade')} (0-6):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="6"
                          step="0.1"
                          value={gradeFormData.grade}
                          onChange={(e) => setGradeFormData({...gradeFormData, grade: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div className="form-row" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {t('grading.studentComment')}:
                        </label>
                        <textarea
                          value={gradeFormData.studentComment}
                          onChange={(e) => setGradeFormData({...gradeFormData, studentComment: e.target.value})}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {isTrainer && (
                        <div className="form-row" style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {t('grading.trainerComment')}:
                          </label>
                          <textarea
                            value={gradeFormData.trainerComment}
                            onChange={(e) => setGradeFormData({...gradeFormData, trainerComment: e.target.value})}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      )}

                      <div className="form-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowGradeFormForSubject(null);
                            setShowGradeFormForModule(null);
                            resetGradeForm();
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {t('common.cancel') || 'Annulla'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveGrade(gradeFormData, editingGrade);
                            setShowGradeFormForSubject(null);
                            setShowGradeFormForModule(null);
                            resetGradeForm();
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--success-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Save size={14} style={{ marginRight: '4px' }} />
                          {t('common.save') || 'Salva'}
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GradingSection;