import React, { useState } from 'react';
import { Bell, Moon, Globe, Lock, Eye, EyeOff, Download, LayoutTemplate, ListFilter, MessageSquare, PanelTop, Minimize2, Users } from 'lucide-react';
import { Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { translate } from '../i18n';
import { loadAllProgress } from '../data/progress.supabase';
import { updateUserPassword } from '../data/users.supabase';
import { trainingPlan } from '../data/trainingPlan';
import { useTheme } from './ThemeProvider';
import APP_VERSION from '../appVersion';

const DEFAULT_SETTINGS = {
  notifications: true,
  startView: 'dashboard',
  showOnlyIncompleteObjectives: false,
  autoOpenCommentedObjectives: true,
  compactMode: false,
  reducedMotion: false,
  rememberSelectedStudent: true,
  lastSelectedStudentId: null
};

const SettingsSection = ({
  onResetProgress,
  language,
  onLanguageChange,
  userRole = 'student',
  isReadOnly = false,
  currentUser = null,
  onPasswordChange = null,
  completedObjectives = {},
  selectedStudent = null,
  students = [],
  onStudentSelect = null,
  userSettings = {},
  onUserSettingsChange = null,
  availableStartViews = []
}) => {
  const { mode, toggleMode } = useTheme();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const settings = {
    ...DEFAULT_SETTINGS,
    ...userSettings
  };
  const canChooseStudent = userRole === 'trainer' || userRole === 'admin' || userRole === 'inspector';
  const activeStudent = canChooseStudent ? selectedStudent : currentUser;
  const t = (key) => translate(key, language);

  const updateSettings = (updates) => {
    if (isReadOnly) return;
    if (typeof onUserSettingsChange === 'function') {
      onUserSettingsChange(updates);
    }
  };

  const handleToggleSetting = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleLanguageChange = (e) => {
    if (isReadOnly) return;
    onLanguageChange(e.target.value);
  };

  const handleDarkModeToggle = () => {
    if (isReadOnly) return;
    toggleMode();
  };

  const handleResetProgress = () => {
    if (isReadOnly) return;
    if (window.confirm(t('alertResetConfirm'))) {
      onResetProgress();
    }
  };

  const handleDownloadObjectives = async () => {
    if (!activeStudent) {
      return;
    }

    const objectivesToExport = canChooseStudent
      ? (await loadAllProgress(activeStudent.id)).completedObjectives
      : completedObjectives;

    let content = `RAPPORTO OBIETTIVI DI FORMAZIONE\n`;
    content += `=====================================\n\n`;
    content += `Apprendista: ${activeStudent.name || 'N/A'}\n`;
    content += `Numero: ${activeStudent.studentNumber || 'N/A'}\n`;
    content += `Anno di formazione: ${activeStudent.formationYear || 'N/A'}\n`;
    content += `Data: ${new Date().toLocaleDateString('it-IT')}\n\n`;
    content += `=====================================\n\n`;

    let completedCount = 0;
    let totalCount = 0;

    trainingPlan.competenceFields.forEach(field => {
      content += `CAMPO: ${field.id} - ${translate(`field.${field.id}.name`, language)}\n`;
      content += `---\n`;

      field.competencies.forEach(competency => {
        competency.objectives.forEach(objective => {
          totalCount++;
          const isCompleted = objectivesToExport[objective.id];
          if (isCompleted) completedCount++;
          
          const status = isCompleted ? t('settings.export.completed') : t('settings.export.notCompleted');
          content += `${objective.id} - ${status}\n`;
          content += `   ${translate(`objective.${objective.id}`, language)}\n\n`;
        });
      });
      content += `\n`;
    });

    content += `=====================================\n`;
    content += `RIEPILOGO\n`;
    content += `Obiettivi Completati: ${completedCount}/${totalCount}\n`;
    content += `Percentuale: ${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%\n`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `Obiettivi_${(activeStudent.name || 'studente').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const currentValue = String(currentPassword ?? '');
    const newValue = String(newPassword ?? '');
    const confirmValue = String(confirmPassword ?? '');
    const requirementChecks = {
      lengthRange: newValue.length >= 10 && newValue.length <= 20,
      hasUpper: /[A-Z]/.test(newValue),
      hasLower: /[a-z]/.test(newValue),
      hasNumber: /\d/.test(newValue),
      hasAllowedSpecial: /[!$#_]/.test(newValue),
      hasOnlyAllowedChars: !/[^A-Za-z0-9!$#_]/.test(newValue),
      passwordsEqual: newValue.length > 0 && newValue === confirmValue
    };

    if (!currentUser?.id) {
      setPasswordError(t('login.invalid'));
      return;
    }

    if (!currentValue) {
      setPasswordError(t('settings.password.currentRequired'));
      return;
    }
    if (!newValue) {
      setPasswordError(t('settings.password.newRequired'));
      return;
    }
    if (newValue === currentValue) {
      setPasswordError(t('settings.password.sameAsCurrent'));
      return;
    }

    if (!requirementChecks.lengthRange) {
      setPasswordError(t('settings.password.req.lengthRange'));
      return;
    }
    if (!requirementChecks.hasUpper) {
      setPasswordError(t('settings.password.req.upper'));
      return;
    }
    if (!requirementChecks.hasLower) {
      setPasswordError(t('settings.password.req.lower'));
      return;
    }
    if (!requirementChecks.hasNumber) {
      setPasswordError(t('settings.password.req.number'));
      return;
    }
    if (!requirementChecks.hasAllowedSpecial) {
      setPasswordError(t('settings.password.req.specialAllowed'));
      return;
    }
    if (!requirementChecks.hasOnlyAllowedChars) {
      setPasswordError(t('settings.password.req.noOtherSpecial'));
      return;
    }
    if (!requirementChecks.passwordsEqual) {
      setPasswordError(t('settings.password.req.match'));
      return;
    }

    // Verifica password corrente confrontando con il valore nel profilo utente
    const validCurrentPassword = (currentUser.password || '').trim();
    if (currentValue !== validCurrentPassword) {
      setPasswordError(t('settings.password.incorrect'));
      return;
    }

    // Salva la nuova password su Supabase
    try {
      await updateUserPassword(currentUser.id, newValue);
    } catch (err) {
      setPasswordError(t('login.invalid'));
      return;
    }

    if (onPasswordChange) {
      onPasswordChange(newValue);
    }

    setPasswordSuccess(t('settings.password.success'));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setTimeout(() => {
      setShowPasswordChange(false);
      setPasswordSuccess('');
    }, 2000);
  };

  const livePasswordChecks = {
    lengthRange: newPassword.length >= 10 && newPassword.length <= 20,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasAllowedSpecial: /[!$#_]/.test(newPassword),
    hasOnlyAllowedChars: !/[^A-Za-z0-9!$#_]/.test(newPassword),
    passwordsEqual: newPassword.length > 0 && newPassword === confirmPassword
  };

  const passwordRequirements = [
    { key: 'lengthRange', label: t('settings.password.req.lengthRange') },
    { key: 'hasUpper', label: t('settings.password.req.upper') },
    { key: 'hasLower', label: t('settings.password.req.lower') },
    { key: 'hasNumber', label: t('settings.password.req.number') },
    { key: 'hasAllowedSpecial', label: t('settings.password.req.specialAllowed') },
    { key: 'hasOnlyAllowedChars', label: t('settings.password.req.noOtherSpecial') },
    { key: 'passwordsEqual', label: t('settings.password.req.match') }
  ];

  return (
    <section className="settings-section">
      <div className="section-title">{t('settings.title')}</div>
      {isReadOnly && (
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
          {t('settings.readOnlyNotice')}
        </p>
      )}

      <div className="settings-grid">
        {/* Notifiche */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Bell size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.notifications')}</h3>
              <p>{t('settings.notifications.desc')}</p>
            </div>
          </div>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(settings.notifications)}
                  onChange={() => handleToggleSetting('notifications')}
                  disabled={isReadOnly}
                  color="primary"
                />
              }
              label={settings.notifications ? t('settings.enabled') : t('settings.disabled')}
            />
          </Box>
        </div>

        {/* Modalità Scura */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Moon size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.darkMode')}</h3>
              <p>{t('settings.darkMode.desc')}</p>
            </div>
          </div>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={handleDarkModeToggle}
                  disabled={isReadOnly}
                  color="primary"
                />
              }
              label={mode === 'dark' ? t('settings.enabled') : t('settings.disabled')}
            />
          </Box>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Minimize2 size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.compactMode')}</h3>
              <p>{t('settings.compactMode.desc')}</p>
            </div>
          </div>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(settings.compactMode)}
                  onChange={() => handleToggleSetting('compactMode')}
                  disabled={isReadOnly}
                  color="primary"
                />
              }
              label={settings.compactMode ? t('settings.enabled') : t('settings.disabled')}
            />
          </Box>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <PanelTop size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.reducedMotion')}</h3>
              <p>{t('settings.reducedMotion.desc')}</p>
            </div>
          </div>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(settings.reducedMotion)}
                  onChange={() => handleToggleSetting('reducedMotion')}
                  disabled={isReadOnly}
                  color="primary"
                />
              }
              label={settings.reducedMotion ? t('settings.enabled') : t('settings.disabled')}
            />
          </Box>
        </div>

        {/* Lingua */}
        <div className="settings-card settings-card-full">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Globe size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.language')}</h3>
              <p>{t('settings.language.desc')}</p>
            </div>
          </div>
          <Box sx={{ mt: 2, minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>Lingua</InputLabel>
              <Select
                value={language}
                onChange={handleLanguageChange}
                disabled={isReadOnly}
                label="Lingua"
              >
                <MenuItem value="it">Italiano</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </div>

        <div className="settings-card settings-card-full">
          <div className="settings-card-header">
            <div className="settings-icon">
              <LayoutTemplate size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.startView')}</h3>
              <p>{t('settings.startView.desc')}</p>
            </div>
          </div>
          <Box sx={{ mt: 2, minWidth: 260 }}>
            <FormControl fullWidth>
              <InputLabel>{t('settings.startView')}</InputLabel>
              <Select
                value={settings.startView}
                onChange={(e) => updateSettings({ startView: e.target.value })}
                disabled={isReadOnly}
                label={t('settings.startView')}
              >
                {availableStartViews.map((view) => (
                  <MenuItem key={view.value} value={view.value}>{view.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </div>

        <div className="settings-card settings-card-full settings-card-vertical">
          <div className="settings-card-header">
            <div className="settings-icon">
              <ListFilter size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.objectivePreferences')}</h3>
              <p>{t('settings.objectivePreferences.desc')}</p>
            </div>
          </div>
          <div className="settings-preferences-list">
            <div className="settings-preference-row">
              <div>
                <strong>{t('settings.showOnlyIncompleteObjectives')}</strong>
                <p>{t('settings.showOnlyIncompleteObjectives.desc')}</p>
              </div>
              <Switch
                checked={Boolean(settings.showOnlyIncompleteObjectives)}
                onChange={() => handleToggleSetting('showOnlyIncompleteObjectives')}
                disabled={isReadOnly}
                color="primary"
              />
            </div>
            <div className="settings-preference-row">
              <div>
                <strong>{t('settings.autoOpenCommentedObjectives')}</strong>
                <p>{t('settings.autoOpenCommentedObjectives.desc')}</p>
              </div>
              <Switch
                checked={Boolean(settings.autoOpenCommentedObjectives)}
                onChange={() => handleToggleSetting('autoOpenCommentedObjectives')}
                disabled={isReadOnly}
                color="primary"
              />
            </div>
          </div>
        </div>

        {canChooseStudent && (
          <div className="settings-card settings-card-full settings-card-vertical">
            <div className="settings-card-header">
              <div className="settings-icon">
                <Users size={24} color="var(--text-primary)" />
              </div>
              <div>
                <h3>{t('settings.studentSelection')}</h3>
                <p>{t('settings.studentSelection.desc')}</p>
              </div>
            </div>
            <div className="settings-preferences-list">
              <div className="settings-preference-row">
                <div>
                  <strong>{t('settings.rememberSelectedStudent')}</strong>
                  <p>{t('settings.rememberSelectedStudent.desc')}</p>
                </div>
                <Switch
                  checked={Boolean(settings.rememberSelectedStudent)}
                  onChange={() => updateSettings({
                    rememberSelectedStudent: !settings.rememberSelectedStudent,
                    lastSelectedStudentId: settings.rememberSelectedStudent ? null : selectedStudent?.id || settings.lastSelectedStudentId || null
                  })}
                  disabled={isReadOnly}
                  color="primary"
                />
              </div>

              {students.length > 0 && (
                <Box sx={{ mt: 1, minWidth: 260 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('trainer.selectStudent')}</InputLabel>
                    <Select
                      value={selectedStudent?.id || ''}
                      onChange={(e) => {
                        const nextStudent = students.find((student) => student.id === e.target.value) || null;
                        if (typeof onStudentSelect === 'function') {
                          onStudentSelect(nextStudent);
                        }
                      }}
                      label={t('trainer.selectStudent')}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>{student.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </div>
          </div>
        )}

        <div className="settings-card settings-card-full settings-card-vertical">
          <div className="settings-card-header">
            <div className="settings-icon">
              <MessageSquare size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.quickExport')}</h3>
              <p>{t('settings.quickExport.desc')}</p>
            </div>
          </div>
          <div className="settings-inline-actions">
            <button
              type="button"
              className="btn-primary settings-action-button"
              onClick={handleDownloadObjectives}
              disabled={!activeStudent}
            >
              <Download size={16} />
              {t('settings.quickExport.button')}
            </button>
            {activeStudent && (
              <span className="settings-inline-hint">
                {t('settings.quickExport.target')}: {activeStudent.name}
              </span>
            )}
          </div>
        </div>



        {/* Cambio Password */}
        <div className="settings-card settings-card-full settings-card-vertical">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Lock size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3>{t('settings.changePassword') || 'Cambia Password'}</h3>
              <p>{t('settings.changePassword.desc') || 'Modifica la tua password'}</p>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            disabled={isReadOnly}
            aria-expanded={showPasswordChange}
            style={{ 
              marginTop: '10px',
              width: 'auto',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              border: '2px solid #1a3a52',
              backgroundColor: showPasswordChange ? 'var(--bg-tertiary)' : 'var(--primary-dark)',
              color: showPasswordChange ? 'var(--primary-dark)' : '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '10px 0 0 0',
              alignSelf: 'flex-start'
            }}
          >
            <Lock size={16} />
            {showPasswordChange ? t('settings.cancel') : t('settings.changePasswordButton')}
          </button>

          {showPasswordChange && !isReadOnly && (
            <form onSubmit={handleChangePassword} style={{ marginTop: '20px', width: '100%', maxWidth: '100%' }}>
              <div className="password-change-layout">
                <aside className="password-requirements-card" aria-label={t('settings.password.requirementsTitle')}>
                  <h4>{t('settings.password.requirementsTitle')}</h4>
                  <ul>
                    {passwordRequirements.map((requirement) => {
                      const isPassed = livePasswordChecks[requirement.key];
                      return (
                        <li key={requirement.key} className={isPassed ? 'is-valid' : 'is-invalid'}>
                          <span className="req-dot" aria-hidden="true" />
                          <span>{requirement.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </aside>

                <div className="password-form-panel">
                  {passwordError && (
                    <div style={{ 
                      color: '#dc2626', 
                      padding: '10px', 
                      marginBottom: '10px',
                      backgroundColor: '#fee2e2',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div style={{ 
                      color: '#10b981', 
                      padding: '10px', 
                      marginBottom: '10px',
                      backgroundColor: '#d1fae5',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {passwordSuccess}
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>{t('settings.password.current') || 'Password Attuale'}</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('settings.password.currentPlaceholder')}
                        style={{ width: '100%', padding: '10px 45px 10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280',
                          zIndex: 10
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>{t('settings.password.new') || 'Nuova Password'}</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('settings.password.newPlaceholder')}
                        style={{ width: '100%', padding: '10px 45px 10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280',
                          zIndex: 10
                        }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>{t('settings.password.confirm') || 'Conferma Password'}</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('settings.password.confirmPlaceholder')}
                        style={{ width: '100%', padding: '10px 45px 10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280',
                          zIndex: 10
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ 
                      width: '100%',
                      padding: '12px 20px',
                      fontSize: '15px',
                      fontWeight: '600',
                      backgroundColor: 'var(--accent-success)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: 'var(--shadow)',
                      marginTop: '5px'
                    }}
                    onMouseOver={(e) => e.target.style.filter = 'brightness(0.95)'}
                    onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
                  >
                    {t('settings.savePassword') || 'Salva Nuova Password'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sezione Pericolo - Solo per studenti */}
      {userRole === 'student' && !isReadOnly && (
        <div className="settings-danger-zone">
          <h3 className="danger-title">{t('settings.danger')}</h3>
          <p className="danger-description">{t('settings.danger.desc')}</p>
          
          <button className="btn-danger" onClick={handleResetProgress}>
            {t('settings.reset')}
          </button>
        </div>
      )}

      {/* Informazioni App */}
      <div className="settings-info">
        <h3>{t('settings.info')}</h3>
        <div className="info-item">
          <span>{t('settings.version')}:</span>
          <strong>Version {APP_VERSION}</strong>
        </div>
        <div className="info-item">
          <span>{t('settings.plan')}:</span>
          <strong>SEFRI 24 novembre 2017</strong>
        </div>
        <div className="info-item">
          <span>{t('settings.profession')}:</span>
          <strong>Operatore/Operatrice Informatico AFC</strong>
        </div>
        <div className="info-item">
          <span>{t('settings.professionNumber')}:</span>
          <strong>88605</strong>
        </div>
      </div>
    </section>
  );
};

export default SettingsSection;
