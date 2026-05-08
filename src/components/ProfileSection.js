import React from 'react';
import { Calendar, Briefcase, Hash } from 'lucide-react';
import { translate } from '../i18n';

const ProfileSection = ({ studentName, studentNumber, formationYear, apprenticeshipStart, apprenticeshipEnd, language = 'it' }) => {
  const t = (key) => translate(key, language);
  
  return (
    <section className="profile-section">
      <div className="section-title">{t('dashboard.profile')}</div>
      
      <div className="profile-card">
        <div className="profile-card-hero">
          <div className="profile-avatar">
            {studentName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="profile-hero-name">{studentName}</h3>
            {formationYear && (
              <span className="profile-hero-year">{formationYear}° Anno</span>
            )}
          </div>
        </div>

        <div className="profile-info">
          {studentNumber && (
            <div className="info-group">
              <label><Hash size={13} /> {t('profile.number')}</label>
              <p className="info-value">{studentNumber}</p>
            </div>
          )}
          <div className="info-group">
            <label><Briefcase size={13} /> {t('profile.profession')}</label>
            <p className="info-value">{t('login.title')}</p>
          </div>
        </div>
        
        <div className="profile-info">
          {formationYear && (
            <div className="info-group">
              <label><Calendar size={13} /> {t('profile.year')}</label>
              <p className="info-value">{formationYear}° Anno</p>
            </div>
          )}
          <div className="info-group">
            <label><Calendar size={13} /> {t('profile.apprenticeshipStart')}</label>
            <p className="info-value">{apprenticeshipStart || '—'}</p>
          </div>
          <div className="info-group">
            <label><Calendar size={13} /> {t('profile.apprenticeshipEnd')}</label>
            <p className="info-value">{apprenticeshipEnd || '—'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileSection;
