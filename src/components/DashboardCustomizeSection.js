import React, { useState, useEffect } from 'react';
import { Layout, Check, ClipboardList, Settings, Inbox } from 'lucide-react';
import { translate } from '../i18n';
import { loadDashboardPreferences, saveDashboardPreferences } from '../data/dashboardPreferences.supabase';

const DashboardCustomizeSection = ({ language, currentUser, onPreferencesUpdate }) => {
  const [preferences, setPreferences] = useState({
    showProfile: true,
    showProgress: true,
    showQuickActions: true,
    shortcuts: []
  });

  const [saved, setSaved] = useState(false);

  const t = (key) => translate(key, language);

  useEffect(() => {
    if (currentUser) {
      loadDashboardPreferences(currentUser.id)
        .then(prefs => setPreferences(prefs))
        .catch(() => {});
    }
  }, [currentUser]);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const handleSave = () => {
    if (currentUser) {
      saveDashboardPreferences(currentUser.id, preferences).catch(console.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onPreferencesUpdate) {
        onPreferencesUpdate();
      }
    }
  };

  const handleReset = () => {
    const defaultPrefs = {
      showProfile: true,
      showProgress: true,
      showQuickActions: true,
      shortcuts: []
    };
    setPreferences(defaultPrefs);
    if (currentUser) {
      saveDashboardPreferences(currentUser.id, defaultPrefs).catch(console.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onPreferencesUpdate) {
        onPreferencesUpdate();
      }
    }
  };

  const availableShortcuts = [
    { id: 'objectives', label: t('menu.dashboard'), Icon: ClipboardList },
    { id: 'settings', label: t('menu.settings'), Icon: Settings },
    { id: 'inbox', label: t('inbox.title'), Icon: Inbox }
  ];

  const toggleShortcut = (shortcutId) => {
    setPreferences(prev => {
      const shortcuts = prev.shortcuts || [];
      const exists = shortcuts.includes(shortcutId);
      return {
        ...prev,
        shortcuts: exists 
          ? shortcuts.filter(id => id !== shortcutId)
          : [...shortcuts, shortcutId]
      };
    });
    setSaved(false);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '30px'
      }}>
        <Layout size={32} color="#1a3a52" />
        <h2 style={{ margin: 0, color: '#1a3a52' }}>{t('dashboard.customize')}</h2>
      </div>

      <p style={{
        color: '#6b7280',
        marginBottom: '30px',
        fontSize: '15px'
      }}>
        {t('dashboard.customize.desc')}
      </p>

      {/* Widget Visibility */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: '#1a3a52',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {t('dashboard.customize.widgets')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Show Profile */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <span style={{ color: '#1f2937', fontWeight: '500' }}>
              {t('dashboard.customize.showProfile')}
            </span>
            <input
              type="checkbox"
              checked={preferences.showProfile}
              onChange={() => handleToggle('showProfile')}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            />
          </label>

          {/* Show Progress */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <span style={{ color: '#1f2937', fontWeight: '500' }}>
              {t('dashboard.customize.showProgress')}
            </span>
            <input
              type="checkbox"
              checked={preferences.showProgress}
              onChange={() => handleToggle('showProgress')}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            />
          </label>

          {/* Show Quick Actions */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <span style={{ color: '#1f2937', fontWeight: '500' }}>
              {t('dashboard.customize.showQuickActions')}
            </span>
            <input
              type="checkbox"
              checked={preferences.showQuickActions}
              onChange={() => handleToggle('showQuickActions')}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            />
          </label>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: '#1a3a52',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {t('dashboard.customize.shortcuts')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {availableShortcuts.map(shortcut => (
            <label
              key={shortcut.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
                <shortcut.Icon size={18} />
                {shortcut.label}
              </span>
              <input
                type="checkbox"
                checked={(preferences.shortcuts || []).includes(shortcut.id)}
                onChange={() => toggleShortcut(shortcut.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer'
                }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleReset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#4b5563'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#6b7280'}
        >
          {t('dashboard.customize.reset')}
        </button>

        <button
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            backgroundColor: saved ? '#10b981' : '#1a3a52',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={e => {
            if (!saved) e.currentTarget.style.backgroundColor = '#2d5a7a';
          }}
          onMouseOut={e => {
            if (!saved) e.currentTarget.style.backgroundColor = '#1a3a52';
          }}
        >
          {saved && <Check size={18} />}
          {t('dashboard.customize.save')}
        </button>
      </div>

      {saved && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {t('settings.password.success')}
        </div>
      )}
    </div>
  );
};

export default DashboardCustomizeSection;
