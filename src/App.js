import React, { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ThemeProvider from './components/ThemeProvider';
import ForceChangePasswordModal from './components/ForceChangePasswordModal';
import { getUserById } from './data/users.supabase';
import { useInactivityTimeout } from './hooks/inactivityTimeout';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [language, setLanguage] = useState('it');

  // Ripristina sessione al refresh — verifica il flag mustChangePassword dal DB
  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const cached = JSON.parse(saved);
        getUserById(cached.id)
          .then((freshUser) => {
            if (!freshUser) {
              localStorage.removeItem('currentUser');
              return;
            }
            if (freshUser.mustChangePassword) {
              setCurrentUser(freshUser);
              setCurrentScreen('forceChangePassword');
            } else {
              setCurrentUser(freshUser);
              setIsLoggedIn(true);
              setCurrentScreen('dashboard');
            }
          })
          .catch(() => {
            // Fallback: usa i dati in cache se il DB non è raggiungibile
            setCurrentUser(cached);
            setIsLoggedIn(true);
            setCurrentScreen('dashboard');
          });
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Monitoraggio inattività - logout dopo 5 minuti
  const handleInactivityTimeout = () => {
    handleLogout();
  };

  const { showWarning, dismissWarning } = useInactivityTimeout(
    5, // 5 minuti
    handleInactivityTimeout,
    isLoggedIn // Monitora solo quando loggato
  );

  // Carica impostazioni utente quando cambia currentUser
  useEffect(() => {
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`userSettings_${currentUser.id}`) || 'null');
      if (saved?.language) setLanguage(saved.language);
      else setLanguage(currentUser.settings?.language || 'it');
    }
  }, [currentUser]);

  const handleLogin = (user) => {
    if (user.mustChangePassword) {
      // Salva l'utente in modo che il modal possa usare user.id,
      // ma NON salvare la sessione e NON andare alla dashboard finché non cambia la password
      setCurrentUser(user);
      setCurrentScreen('forceChangePassword');
      return;
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handlePasswordChanged = () => {
    const userWithoutFlag = { ...currentUser, mustChangePassword: false };
    setCurrentUser(userWithoutFlag);
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
    localStorage.setItem('currentUser', JSON.stringify(userWithoutFlag));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentScreen('login');
    localStorage.removeItem('currentUser');
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(`userSettings_${currentUser.id}`) || '{}');
      localStorage.setItem(`userSettings_${currentUser.id}`, JSON.stringify({ ...saved, language: newLanguage }));
    }
  };

  return (
    <ThemeProvider>
      <div className="App">
        {/* Dialog di avviso inattività */}
        {showWarning && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '400px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#1a3a52' }}>
                Sessione in scadenza
              </h2>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', lineHeight: '1.5' }}>
                Non hai interagito con la pagina per 5 minuti. La tua sessione scadrà tra 30 secondi.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={dismissWarning}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  Continua sessione
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {(currentScreen === 'login' || currentScreen === 'forceChangePassword') && (
          <LoginScreen
            onLogin={handleLogin}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}
        {currentScreen === 'forceChangePassword' && currentUser && (
          <ForceChangePasswordModal
            user={currentUser}
            language={language}
            onPasswordChanged={handlePasswordChanged}
          />
        )}
        {currentScreen === 'dashboard' && currentUser && (
          <DashboardScreen
            currentUser={currentUser}
            onLogout={handleLogout}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
