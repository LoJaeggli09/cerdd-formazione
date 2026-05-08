import React, { useEffect, useState } from 'react';
import { trainingPlan } from '../data/trainingPlan';
import { translate } from '../i18n';

const ProgressSection = ({ completedObjectives = {}, language = 'it' }) => {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalObjectives, setTotalObjectives] = useState(0);
  const t = (key) => translate(key, language);

  useEffect(() => {
    // Verifica che trainingPlan sia disponibile
    if (!trainingPlan || !trainingPlan.competenceFields) {
      console.error('trainingPlan non disponibile o malformato');
      return;
    }

    // Calcola il numero totale di obiettivi
    let totalObjectives = 0;
    let completedCount = 0; 

    

    try {
      trainingPlan.competenceFields.forEach(field => {
        if (field && field.competencies) {
          field.competencies.forEach(competency => {
            if (competency && competency.objectives) {
              competency.objectives.forEach(objective => {
                if (objective && objective.id) {
                  totalObjectives += 1;
                  if (completedObjectives && completedObjectives[objective.id]) {
                    completedCount += 1;
                  }
                }
              });
            }
          });
        }
      });
    } catch (error) {
      console.errorer("Errore durante il calcolo degli obbiettivi", error);
      return;
    }

    // Calcola la percentuale
    const percentage = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;
    setTotalObjectives(totalObjectives);
    setCompletedCount(completedCount);
    setProgressPercentage(percentage);
  }, [completedObjectives]);

  const remainingCount = Math.max(0, totalObjectives - completedCount);
  const milestone =
    progressPercentage >= 90 ? 'Fase finale' :
    progressPercentage >= 60 ? 'Ottimo avanzamento' :
    progressPercentage >= 30 ? 'Buon inizio' :
    'Avvio percorso';

  return (
    <section className="progress-section">
      <div className="section-title">{t('dashboard.progress')}</div>
      
      <div className="progress-card">
        <div className="progress-info">
          <h3>{t('progress.title')}</h3>
          <p className="progress-percentage">{progressPercentage}%</p>
          <p className="progress-milestone">{milestone}</p>
          <div className="progress-kpis">
            <div className="progress-kpi-item">
              <span className="progress-kpi-label">Completati</span>
              <strong className="progress-kpi-value">{completedCount}</strong>
            </div>
            <div className="progress-kpi-item">
              <span className="progress-kpi-label">Rimanenti</span>
              <strong className="progress-kpi-value">{remainingCount}</strong>
            </div>
            <div className="progress-kpi-item">
              <span className="progress-kpi-label">Totale</span>
              <strong className="progress-kpi-value">{totalObjectives}</strong>
            </div>
          </div>
        </div>

        <div className="progress-bars">
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="progress-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="circle-background" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                className="circle-progress"
                style={{
                  strokeDasharray: `${progressPercentage * 2.827} 282.7`
                }}
              />
              <text x="50" y="50" textAnchor="middle" dy="0.3em" className="circle-text">
                {progressPercentage}%
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProgressSection;
