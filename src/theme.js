import { createTheme } from '@mui/material/styles';

// Tema base Material Design
const createAppTheme = (mode = 'light') => {
  const baseTheme = {
    palette: {
      mode,
      primary: {
        main: '#1565c0',
        light: mode === 'dark' ? '#42a5f5' : '#1976d2',
        dark: mode === 'dark' ? '#1565c0' : '#0d47a1',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#e3f2fd',
        light: mode === 'dark' ? '#e3f2fd' : '#f8fafc',
        dark: mode === 'dark' ? '#42a5f5' : '#bbdefb',
        contrastText: mode === 'dark' ? '#000000' : '#1565c0',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#fafafa',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#b0b0b0' : '#616161',
      },
      success: {
        main: mode === 'dark' ? '#4caf50' : '#2e7d32',
        contrastText: '#ffffff',
      },
      warning: {
        main: mode === 'dark' ? '#ff9800' : '#f57c00',
        contrastText: '#000000',
      },
      error: {
        main: mode === 'dark' ? '#f44336' : '#d32f2f',
        contrastText: '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        '@media (max-width:768px)': {
          fontSize: '2rem',
        },
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        '@media (max-width:768px)': {
          fontSize: '1.75rem',
        },
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:768px)': {
          fontSize: '1.5rem',
        },
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:768px)': {
          fontSize: '1.25rem',
        },
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
        '@media (max-width:768px)': {
          fontSize: '1.1rem',
        },
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
        '@media (max-width:768px)': {
          fontSize: '0.95rem',
        },
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        '@media (max-width:768px)': {
          fontSize: '0.95rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        '@media (max-width:768px)': {
          fontSize: '0.85rem',
        },
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        '@media (max-width:768px)': {
          fontSize: '0.9rem',
        },
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 4px 12px rgba(255, 255, 255, 0.1)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
            '@media (max-width:768px)': {
              padding: '10px 20px',
              fontSize: '0.9rem',
            },
          },
          contained: {
            boxShadow: mode === 'dark'
              ? '0 2px 8px rgba(255, 255, 255, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 4px 12px rgba(255, 255, 255, 0.05)'
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 8px 24px rgba(255, 255, 255, 0.1)'
                : '0 8px 24px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-4px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'dark' ? '#42a5f5' : '#1976d2',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: '0 16px 16px 0',
            border: 'none',
            boxShadow: mode === 'dark'
              ? '4px 0 12px rgba(255, 255, 255, 0.05)'
              : '4px 0 12px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
              transform: 'translateX(4px)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark'
              ? '0 2px 12px rgba(255, 255, 255, 0.05)'
              : '0 2px 12px rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(10px)',
            backgroundColor: mode === 'dark'
              ? 'rgba(30, 30, 30, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
          },
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
  };

  return createTheme(baseTheme);
};

export default createAppTheme;