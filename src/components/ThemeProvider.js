

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import createAppTheme from '../theme';

// Context per gestire le impostazioni del tema
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  // Carica le impostazioni dal localStorage all'avvio
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');

    if (savedMode) {
      setMode(savedMode);
    }

    localStorage.removeItem('high-contrast');
    localStorage.removeItem('primary-color');
    localStorage.removeItem('secondary-color');
    localStorage.removeItem('background-color');
  }, []);

  // Salva le impostazioni nel localStorage quando cambiano
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Aggiorna il body class per compatibilità con il CSS esistente
  useEffect(() => {
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.removeAttribute('data-theme');
    }

    document.body.classList.remove('high-contrast');
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const theme = createAppTheme(mode);

  const value = {
    mode,
    toggleMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;