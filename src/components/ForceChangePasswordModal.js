import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { updateUserPassword } from '../data/users.supabase';
import { translate } from '../i18n';

const DEFAULT_PASSWORD = 'Abc123!';
const MIN_LENGTH = 8;

const ForceChangePasswordModal = ({ user, language = 'it', onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key) => translate(key, language);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < MIN_LENGTH) {
      setError(t('changePassword.errorLength'));
      return;
    }
    if (newPassword === DEFAULT_PASSWORD) {
      setError(t('changePassword.errorSame'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.errorMatch'));
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(user.id, newPassword);
      onPasswordChanged();
    } catch (err) {
      setError(err.message || 'Errore durante il salvataggio della password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 45px 10px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const eyeButtonStyle = {
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
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '36px 32px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
      }}>
        <h2 style={{ margin: '0 0 12px 0', color: '#1a3a52', fontSize: '20px' }}>
          {t('changePassword.title')}
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', lineHeight: '1.5', fontSize: '14px' }}>
          {t('changePassword.message')}
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
              {t('changePassword.newPassword')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
                autoFocus
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={eyeButtonStyle}>
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
              {t('changePassword.confirmPassword')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeButtonStyle}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#93c5fd' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? '...' : t('changePassword.button')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordModal;
