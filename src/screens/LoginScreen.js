import React, { useState } from 'react';
import { Monitor, Globe, Eye, EyeOff, ImageMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { translate } from '../i18n';
import { authenticateUser } from '../data/users.supabase';

const LoginScreen = ({ onLogin, language = 'it', onLanguageChange }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUsername, setShowUsername] = useState(false);

  const t = (key) => translate(key, language);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalizedUsername = username.trim().replace(/\s+/g, ' ');
    const normalizedPassword = String(password ?? '');
    
    if (!normalizedUsername) {
      setError(t('login.invalid'));
      return;
    }
    
    if (!normalizedPassword.length) {
      setError(t('login.invalid'));
      return;
    }

    // Autenticazione con database utenti
    const user = await authenticateUser(normalizedUsername, normalizedPassword);
    
    if (user) {
      onLogin(user);
    } else {
      setError(t('login.invalid'));
    }
  };

  return (
    <motion.div
      className="login-screen"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(248, 250, 252, 0.85) 0%, rgba(232, 236, 241, 0.85) 100%), url(${process.env.PUBLIC_URL}/sfondo-lock.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="login-container">
        <motion.div
          className="login-card"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {onLanguageChange && (
            <div className="login-language-selector">
              <Globe size={16} />
              <select 
                value={language} 
                onChange={(e) => onLanguageChange(e.target.value)}
                className="language-select"
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
          )}
          
          <div className="login-logo">
            <img src="./LAD_icona_blu.png" alt="Logo" style={{ width: '150px', height: 'auto' }} />
          </div>

          <div className="login-header">
            <h1 className="login-title">{t('login.title')}</h1>
            <p className="login-profession">{t('login.subtitle')}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username" style={{ textAlign: 'left', display: 'block', marginBottom: '5px' }}>{t('login.username')}</label>
              <input
                type="text"
                id="username"
                placeholder={t('login.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus                style={{ paddingLeft: '12px', textAlign: 'left' }}              />
            </div>

            <div className="form-group">
              <label htmlFor="password" style={{ textAlign: 'left', display: 'block', marginBottom: '5px' }}>{t('login.password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 45px 10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="login-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('login.button')}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
