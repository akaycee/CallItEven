import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';

export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function AppWrapper() {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    // Load user-specific theme preference
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        const savedMode = localStorage.getItem(`themeMode_${parsedUser._id}`);
        if (savedMode) {
          setMode(savedMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    }

    // Listen for login events to apply user's theme preference
    const handleLogin = (event) => {
      const userData = event.detail;
      const savedMode = localStorage.getItem(`themeMode_${userData._id}`);
      if (savedMode) {
        setMode(savedMode);
      } else {
        setMode('light');
      }
    };

    // Listen for logout events to reset theme
    const handleLogout = () => {
      setMode('light');
    };

    window.addEventListener('userLogin', handleLogin);
    window.addEventListener('userLogout', handleLogout);
    
    return () => {
      window.removeEventListener('userLogin', handleLogin);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  useEffect(() => {
    // Save user-specific theme preference
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        localStorage.setItem(`themeMode_${parsedUser._id}`, mode);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#06b6d4',
        light: '#22d3ee',
        dark: '#0891b2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#f97316',
        light: '#fb923c',
        dark: '#ea580c',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
      },
      background: {
        default: mode === 'light' ? '#f0fdfa' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f1f5f9',
        secondary: mode === 'light' ? '#475569' : '#94a3b8',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: [
      'none',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: '0.95rem',
            fontWeight: 600,
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 10px 20px -10px rgba(6, 182, 212, 0.4)',
              transform: 'translateY(-2px)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 10px 20px -10px rgba(6, 182, 212, 0.5)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 0 0 4px rgba(6, 182, 212, 0.1)',
              },
              '&.Mui-focused': {
                boxShadow: '0 0 0 4px rgba(6, 182, 212, 0.2)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: '0 10px 20px -5px rgba(6, 182, 212, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 20px 30px -5px rgba(6, 182, 212, 0.5)',
              transform: 'translateY(-4px) scale(1.05)',
            },
          },
        },
      },
    },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);
