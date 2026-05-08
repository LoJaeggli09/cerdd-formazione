import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Edit, Trash2, Save, X, Plus, ArrowLeft } from 'lucide-react';
import { translate } from '../i18n';
import { saveGrade, loadGrades, updateGrade, deleteGrade } from '../data/grades.supabase';
import { saveModuleTest, loadModuleTests, updateModuleTest, deleteModuleTest, getModuleDetails } from '../data/grades';

const CourseDetailScreen = ({
  item,
  itemType, // 'subject' or 'module'
  studentId,
  language = 'it',
  userRole = 'student',
  isTrainer = false,
  isReadOnly = false,
  onBack
}) => {
  const t = (key) => translate(key, language);
  const [grades, setGrades] = useState([]);
  const [tests, setTests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    grade: '',
    score: '',
    studentComment: '',
    trainerComment: '',
    comments: ''
  });

  const canEdit = !isReadOnly && ((userRole === 'student' && !isTrainer) || isTrainer);

  useEffect(() => {
    loadData();
  }, [item, itemType, studentId]);

  const loadData = async () => {
    if (itemType === 'subject') {
      try {
        const allGrades = await loadGrades(studentId);
        const subjectGrades = allGrades.filter(grade => grade.subject === item.key);
        setGrades(subjectGrades.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        console.error('Errore caricamento voti:', e);
      }
    } else {
      const moduleTests = loadModuleTests(studentId, item);
      setTests(moduleTests.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const resetForm = () => {
    setFormData({
      grade: '',
      score: '',
      studentComment: '',
      trainerComment: '',
      comments: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (itemType === 'subject') {
      setFormData({
        grade: item.grade.toString(),
        studentComment: item.studentComment || '',
        trainerComment: item.trainerComment || '',
        comments: ''
      });
    } else {
      setFormData({
        grade: '',
        score: (item.score || '').toString(),
        studentComment: '',
        trainerComment: '',
        comments: item.comments || ''
      });
    }
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (itemType === 'subject') {
      const gradeValue = parseFloat(formData.grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 6) {
        alert(t('grading.gradeRange') || 'Grade must be between 0 and 6');
        return;
      }
      try {
        if (editingItem) {
          await updateGrade(studentId, editingItem.id, {
            grade: gradeValue,
            studentComment: formData.studentComment,
            trainerComment: formData.trainerComment
          });
        } else {
          await saveGrade(studentId, {
            subject: item.key,
            grade: gradeValue,
            studentComment: formData.studentComment,
            trainerComment: formData.trainerComment
          });
        }
      } catch (e) {
        console.error('Errore salvataggio voto:', e);
      }
    } else {
      const scoreValue = parseFloat(formData.score);
      if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 6) {
        alert(t('moduleTests.scoreRange') || 'Score must be between 0 and 6');
        return;
      }
      if (editingItem) {
        updateModuleTest(studentId, item, editingItem.id, {
          score: scoreValue,
          comments: formData.comments
        });
      } else {
        saveModuleTest(studentId, item, {
          score: scoreValue,
          comments: formData.comments
        });
      }
    }
    await loadData();
    resetForm();
  };

  const handleDelete = async (itemId) => {
    if (window.confirm(t('grading.confirmDelete'))) {
      if (itemType === 'subject') {
        try {
          await deleteGrade(studentId, itemId);
        } catch (e) {
          console.error('Errore eliminazione voto:', e);
        }
      } else {
        deleteModuleTest(studentId, item, itemId);
      }
      await loadData();
    }
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

  const getAverage = () => {
    if (itemType === 'subject') {
      if (grades.length === 0) return null;
      const sum = grades.reduce((acc, g) => acc + g.grade, 0);
      return (sum / grades.length).toFixed(1);
    } else {
      if (tests.length === 0) return null;
      const validScores = tests.filter(t => t.score !== null && t.score !== undefined);
      if (validScores.length === 0) return null;
      const sum = validScores.reduce((acc, t) => acc + t.score, 0);
      return (sum / validScores.length).toFixed(1);
    }
  };

  const moduleDetails = itemType === 'module' ? getModuleDetails(item) : null;
  const average = getAverage();
  const items = itemType === 'subject' ? grades : tests;

  return (
    <div className="course-detail-screen">
      <div className="detail-header">
        <button
          className="back-button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={16} />
          {t('common.back') || 'Indietro'}
        </button>
        <h1>{itemType === 'subject' ? item.label : `Modulo ${item}`}</h1>
      </div>

      <div className="detail-content">
        {/* Module Details */}
        {itemType === 'module' && moduleDetails && (
          <div className="module-info">
            {moduleDetails.field && (
              <div className="field-info">
                <h3>{moduleDetails.field.name}</h3>
                <p>{moduleDetails.field.description}</p>
              </div>
            )}
            {moduleDetails.competencies.map((competency, idx) => (
              <div key={idx} className="competency-info">
                <h4>{competency.name}</h4>
                <ul>
                  {competency.objectives.map((objective) => (
                    <li key={objective.id}>
                      {objective.text} (Livello: {objective.level})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Average */}
        {average && (
          <div className="average-section">
            <h3>{t('grading.average')}: {average}</h3>
            <div className="stars">{renderStars(Math.round(parseFloat(average)))}</div>
          </div>
        )}

        {/* Items List */}
        <div className="items-section">
          <div className="section-header">
            <h3>{itemType === 'subject' ? t('grading.grades') || 'Valutazioni' : t('moduleTests.title')}</h3>
            {canEdit && (
              <button
                type="button"
                className="add-button"
                onClick={() => setShowAddForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--success-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                {t('common.add') || 'Aggiungi'}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="no-data">{t('grading.noGrades') || 'Nessuna valutazione presente'}</p>
          ) : (
            <div className="items-list">
              {items.map((item, index) => (
                <div key={item.id || index} className="item-card">
                  <div className="item-header">
                    <div className="item-info">
                      {itemType === 'subject' ? (
                        <>
                          <div className="stars">{renderStars(Math.round(item.grade))}</div>
                          <span className="item-value">{item.grade}</span>
                        </>
                      ) : (
                        <>
                          <span className="item-label">{t('moduleTests.score') || 'Punteggio'}:</span>
                          <span className="item-value">{item.score}</span>
                        </>
                      )}
                      <span className="item-date">
                        {new Date(item.date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : 'fr-FR')}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="item-actions">
                        <button
                          className="edit-button"
                          onClick={() => handleEdit(item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {item.comments && (
                    <div className="item-comments">
                      <strong>{t('moduleTests.comments') || 'Commenti'}:</strong> {item.comments}
                    </div>
                  )}
                  {item.studentComment && (
                    <div className="item-student-comment">
                      <MessageSquare size={14} />
                      <strong>{t('grading.studentComment') || 'Commento studente'}:</strong> {item.studentComment}
                    </div>
                  )}
                  {item.trainerComment && (
                    <div className="item-trainer-comment">
                      <MessageSquare size={14} />
                      <strong>{t('grading.trainerComment') || 'Commento formatore'}:</strong> {item.trainerComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && canEdit && (
          <div className="form-overlay">
            <div className="form-container">
              <div className="form-header">
                <h3>
                  {editingItem
                    ? (t('common.edit') || 'Modifica')
                    : (t('common.add') || 'Aggiungi')} {itemType === 'subject' ? t('grading.grade') || 'Valutazione' : t('moduleTests.test') || 'Test'}
                </h3>
                <button
                  className="close-button"
                  onClick={resetForm}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                >
                  <X />
                </button>
              </div>
              <div className="form-content">
                {itemType === 'subject' ? (
                  <>
                    <div className="form-group">
                      <label>{t('grading.grade')} (0-6):</label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        step="0.1"
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('grading.studentComment') || 'Commento studente'}:</label>
                      <textarea
                        value={formData.studentComment}
                        onChange={(e) => setFormData({...formData, studentComment: e.target.value})}
                        rows={3}
                      />
                    </div>
                    {isTrainer && (
                      <div className="form-group">
                        <label>{t('grading.trainerComment') || 'Commento formatore'}:</label>
                        <textarea
                          value={formData.trainerComment}
                          onChange={(e) => setFormData({...formData, trainerComment: e.target.value})}
                          rows={3}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>{t('moduleTests.score') || 'Punteggio'} (0-6):</label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        step="0.1"
                        value={formData.score}
                        onChange={(e) => setFormData({...formData, score: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('moduleTests.comments') || 'Commenti'}:</label>
                      <textarea
                        value={formData.comments}
                        onChange={(e) => setFormData({...formData, comments: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </>
                )}
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={resetForm}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--secondary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    {t('common.cancel') || 'Annulla'}
                  </button>
                  <button
                    type="button"
                    className="save-button"
                    onClick={handleSave}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--success-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Save size={16} style={{ marginRight: '4px' }} />
                    {t('common.save') || 'Salva'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailScreen;