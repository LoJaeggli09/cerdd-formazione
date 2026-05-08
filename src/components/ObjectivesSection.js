import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronUp, Award, MessageSquare, Paperclip, X, Save } from 'lucide-react';
import { trainingPlan, bloomLevels } from '../data/trainingPlan';
import { translate } from '../i18n';
import { loadStudentApprovals } from '../data/notifications.supabase';

const normalizeObjectiveSteps = (steps = {}) => ({
  spiegato: Boolean(steps.spiegato),
  esercitato: Boolean(steps.esercitato),
  autonomo: Boolean(steps.autonomo)
});

const STEP_KEYS = ['spiegato', 'esercitato', 'autonomo'];

const ObjectivesSection = ({ completedObjectives, objectiveSteps = {}, onUpdateObjectiveStep, onSave, isSaving = false, language = 'it', userRole = 'student', isTrainer = false, isReadOnly = false, studentId = null, comments = {}, onCommentChange, onAttachFile, onRemoveAttachment, objectiveFocus = null, preferences = {} }) => {
  const canEdit = !isReadOnly && (userRole === 'student' || isTrainer);
  const {
    showOnlyIncompleteObjectives = false,
    autoOpenCommentedObjectives = false,
    reducedMotion = false
  } = preferences;
  const [expandedField, setExpandedField] = useState('A');
  const [expandedCompetency, setExpandedCompetency] = useState({});
  const [approvedObjectives, setApprovedObjectives] = useState({});
  const [showComments, setShowComments] = useState({});
  const t = (key) => translate(key, language);

  useEffect(() => {
    if (studentId) {
      loadStudentApprovals(studentId)
        .then(approvals => setApprovedObjectives(approvals))
        .catch(() => setApprovedObjectives({}));
    }
  }, [studentId, completedObjectives]);

  useEffect(() => {
    if (!objectiveFocus || !objectiveFocus.objectiveId) return;
    if (objectiveFocus.fieldId) setExpandedField(objectiveFocus.fieldId);
    if (objectiveFocus.competencyId) {
      setExpandedCompetency(prev => ({ ...prev, [objectiveFocus.competencyId]: true }));
    }
    setTimeout(() => {
      const element = document.getElementById(`objective-${objectiveFocus.objectiveId}`);
      if (element) {
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        if (!reducedMotion) {
          element.classList.add('highlight-pulse');
          setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
        }
      }
    }, 150);
  }, [objectiveFocus, reducedMotion]);

  useEffect(() => {
    if (!autoOpenCommentedObjectives) return;

    setShowComments((prev) => {
      const nextState = { ...prev };
      let didChange = false;

      trainingPlan.competenceFields.forEach((field) => {
        field.competencies.forEach((competency) => {
          competency.objectives.forEach((objective) => {
            const objectiveComments = comments[objective.id] || {};
            const hasContent = Boolean(
              objectiveComments.student ||
              objectiveComments.trainer ||
              (objectiveComments.attachments && objectiveComments.attachments.length > 0)
            );

            if (hasContent && typeof nextState[objective.id] === 'undefined') {
              nextState[objective.id] = true;
              didChange = true;
            }
          });
        });
      });

      return didChange ? nextState : prev;
    });
  }, [autoOpenCommentedObjectives, comments]);

  const toggleFieldExpanded = (fieldId) => setExpandedField(expandedField === fieldId ? null : fieldId);
  const toggleCompetencyExpanded = (competencyId) => setExpandedCompetency(prev => ({ ...prev, [competencyId]: !prev[competencyId] }));
  const toggleComments = (objectiveId) => setShowComments(prev => ({ ...prev, [objectiveId]: !prev[objectiveId] }));

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 size={18} className="icon-completed" />;
    if (status === 'in-progress') return <AlertCircle size={18} className="icon-inprogress" />;
    return <Circle size={18} className="icon-notstarted" />;
  };

  const getObjectiveStatus = (objectiveId) => completedObjectives[objectiveId] ? 'completed' : 'not-started';

  const getObjectiveSteps = (objectiveId) => normalizeObjectiveSteps(objectiveSteps[objectiveId]);

  const handleStepChange = (objectiveId, step, checked) => {
    if (!canEdit) return;
    if (typeof onUpdateObjectiveStep === 'function') {
      onUpdateObjectiveStep(objectiveId, step, checked);
    }
  };

  const handleCommentChange = (objectiveId, commentType, value) => {
    if (isReadOnly) return;
    if (onCommentChange) onCommentChange(objectiveId, commentType, value);
  };

  const handleFileInput = (e, objectiveId) => {
    if (isReadOnly) return;
    const file = e.target.files && e.target.files[0];
    if (file && typeof onAttachFile === 'function') {
      onAttachFile(objectiveId, file);
      e.target.value = null;
    }
  };

  const getCompletedStepsCount = (objectiveId) => {
    const steps = getObjectiveSteps(objectiveId);
    return STEP_KEYS.filter(k => steps[k]).length;
  };

  const getFieldProgress = (field) => {
    let total = 0, completed = 0;
    field.competencies.forEach(comp => {
      comp.objectives.forEach(obj => {
        total++;
        if (completedObjectives[obj.id]) completed++;
      });
    });
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getVisibleObjectives = (objectives = []) => objectives.filter((objective) => {
    if (!showOnlyIncompleteObjectives) {
      return true;
    }

    if (objectiveFocus?.objectiveId === objective.id) {
      return true;
    }

    return !completedObjectives[objective.id];
  });

  return (
    <section className="objectives-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <div className="section-title" style={{ margin: 0 }}>{t('objectives.title')}</div>
        {!isReadOnly && typeof onSave === 'function' && (
          <button
            onClick={onSave}
            disabled={isSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: isSaving ? '#94a3b8' : '#3b82f6',
              color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: '0.875rem'
            }}
          >
            <Save size={16} />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
        )}
      </div>
      <p className="objectives-subtitle">{t('objectives.subtitle')}</p>

      {trainingPlan.competenceFields.map((field) => {
        const { total, completed, pct } = getFieldProgress(field);
        return (
          <div key={field.id} className={`competence-field${expandedField === field.id ? ' is-expanded' : ''}`}>
            <button className="field-header" onClick={() => toggleFieldExpanded(field.id)}>
              <div className="field-title-group">
                <span className="field-badge">{field.id}</span>
                <div className="field-title-text">
                  <h3 className="field-name">{t(`field.${field.id}.name`)}</h3>
                  <p className="field-description">{t(`field.${field.id}.desc`)}</p>
                </div>
              </div>
              <div className="field-header-right">
                <span className="field-progress-pill">{completed}/{total}</span>
                {expandedField === field.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Mini progress bar under the header */}
            <div className="field-progress-bar-wrap">
              <div className="field-progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>

            {expandedField === field.id && (
              <div className="field-content">
                {field.competencies.map((competency) => {
                  const isExpanded = expandedCompetency[competency.id];
                  const compTotal = competency.objectives.length;
                  const compDone = competency.objectives.filter(obj => completedObjectives[obj.id]).length;
                  const visibleObjectives = getVisibleObjectives(competency.objectives);
                  return (
                    <div key={competency.id} className={`competency-block${isExpanded ? ' is-expanded' : ''}`}>
                      <button className="competency-header" onClick={() => toggleCompetencyExpanded(competency.id)}>
                        <div className="competency-title-group">
                          <span className="competency-badge">{competency.id}</span>
                          <h4>{t(`comp.${competency.id}`)}</h4>
                        </div>
                        <div className="competency-header-right">
                          <span className="competency-count">{compDone}/{compTotal}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="objectives-list">
                          {visibleObjectives.length === 0 && (
                            <div className="objectives-empty-state">{t('objectives.noVisibleObjectives')}</div>
                          )}

                          {visibleObjectives.map((objective) => {
                            const status = getObjectiveStatus(objective.id);
                            const bloomLevel = bloomLevels[objective.level];
                            const steps = getObjectiveSteps(objective.id);
                            const stepsDone = STEP_KEYS.filter(k => steps[k]).length;
                            const hasComments = comments[objective.id]?.student || comments[objective.id]?.trainer;
                            const commentsCount = (comments[objective.id]?.student ? 1 : 0) + (comments[objective.id]?.trainer ? 1 : 0);
                            const isApproved = approvedObjectives[objective.id]?.approved;

                            return (
                              <div
                                key={objective.id}
                                id={`objective-${objective.id}`}
                                className={`objective-item status-${status}`}
                              >
                                {/* Status + Details */}
                                <div className="objective-status">{getStatusIcon(status)}</div>

                                <div className="objective-details">
                                  {/* Header row: code + approved badge */}
                                  <div className="objective-header-row">
                                    <span className="objective-code">{objective.id}</span>
                                    {isApproved && (
                                      <span className="objective-approved-badge">
                                        <Award size={11} />
                                        {t('objectives.approved')}
                                      </span>
                                    )}
                                    <div className="objective-meta">
                                      <span
                                        className="bloom-level"
                                        style={{ backgroundColor: bloomLevel.color + '20', borderColor: bloomLevel.color, color: bloomLevel.color }}
                                      >
                                        {bloomLevel.name}
                                      </span>
                                      {objective.modules && objective.modules.length > 0 && (
                                        <span className="modules-info">{t('objectives.modules')}: {objective.modules.join(', ')}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Objective text */}
                                  <p className="objective-text">{t(`objective.${objective.id}`)}</p>

                                  {/* Step progress â€” 3-pill row */}
                                  <div className="objective-steps">
                                    {STEP_KEYS.map((stepKey) => (
                                      <label
                                        key={stepKey}
                                        className={`objective-step${steps[stepKey] ? ' step-done' : ''}${!canEdit ? ' step-readonly' : ''}`}
                                        title={canEdit ? undefined : t('settings.readOnlyNotice')}
                                      >
                                        <input
                                          type="checkbox"
                                          className="objective-step-input"
                                          checked={steps[stepKey]}
                                          onChange={(e) => handleStepChange(objective.id, stepKey, e.target.checked)}
                                          disabled={!canEdit}
                                        />
                                        <span className="step-dot">{steps[stepKey] ? 'âœ“' : ''}</span>
                                        <span className="step-label">{t(`objectives.step.${stepKey}`)}</span>
                                      </label>
                                    ))}
                                    {canEdit && (
                                      <span className="steps-progress-text">{stepsDone}/3</span>
                                    )}
                                  </div>

                                  {/* Comments toggle */}
                                  <button
                                    className={`objective-comments-btn${showComments[objective.id] ? ' active' : ''}`}
                                    onClick={() => toggleComments(objective.id)}
                                  >
                                    <MessageSquare size={13} />
                                    {showComments[objective.id] ? (t('comments.hide') || 'Nascondi note') : (t('comments.show') || 'Note & Allegati')}
                                    {hasComments && <span className="comments-count">{commentsCount}</span>}
                                  </button>

                                  {/* Comments panel */}
                                  {showComments[objective.id] && (
                                    <div className="objective-comments-panel">
                                      {/* Student comment */}
                                      <div className="comment-block">
                                        <label className="comment-label">
                                          <MessageSquare size={13} />
                                          {t('comments.student') || 'Note Apprendista'}
                                        </label>
                                        <textarea
                                          className={`comment-textarea${isTrainer || isReadOnly ? ' comment-readonly' : ''}`}
                                          value={comments[objective.id]?.student || ''}
                                          onChange={(e) => handleCommentChange(objective.id, 'student', e.target.value)}
                                          disabled={isTrainer || isReadOnly}
                                          placeholder={t('comments.studentPlaceholder') || 'Appunti, domande o riflessioni...'}
                                          rows={3}
                                        />
                                      </div>

                                      {/* Trainer comment */}
                                      <div className="comment-block">
                                        <label className="comment-label">
                                          <MessageSquare size={13} />
                                          {t('comments.trainer') || 'Feedback Formatore'}
                                        </label>
                                        <textarea
                                          className={`comment-textarea${!isTrainer || isReadOnly ? ' comment-readonly' : ''}`}
                                          value={comments[objective.id]?.trainer || ''}
                                          onChange={(e) => handleCommentChange(objective.id, 'trainer', e.target.value)}
                                          disabled={!isTrainer || isReadOnly}
                                          placeholder={t('comments.trainerPlaceholder') || 'Feedback, suggerimenti o valutazione...'}
                                          rows={3}
                                        />
                                      </div>

                                      {/* Attachments */}
                                      <div className="comment-block">
                                        <label className="comment-label">
                                          <Paperclip size={13} />
                                          {t('comments.attachments') || 'Allegati'}
                                        </label>
                                        <div className="attachments-row">
                                          {!isReadOnly && (
                                            <label className="attach-btn">
                                              <Paperclip size={13} />
                                              {t('comments.addFile') || 'Aggiungi file'}
                                              <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileInput(e, objective.id)} />
                                            </label>
                                          )}
                                          {(comments[objective.id]?.attachments || []).map((a, idx) => (
                                            <div key={idx} className="attachment-chip">
                                              <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                                              {!isReadOnly && (
                                                <button className="attachment-remove" onClick={() => onRemoveAttachment && onRemoveAttachment(objective.id, idx)}>
                                                  <X size={11} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Bloom legend */}
      <div className="objectives-legend">
        <h4>{t('objectives.legend')}:</h4>
        <div className="legend-items">
          {Object.entries(bloomLevels).map(([level, info]) => (
            <div key={level} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: info.color }} />
              <div>
                <strong>{level}</strong>: {info.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObjectivesSection;
