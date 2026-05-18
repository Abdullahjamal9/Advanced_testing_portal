import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ptis_dark_mode');
    return saved === 'true';
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('ptis_dark_mode', newValue);
      return newValue;
    });
  };

  const theme = {
    bg: {
      primary: isDarkMode ? '#0f172a' : '#ffffff',
      secondary: isDarkMode ? '#1e293b' : '#f8f9fa',
      tertiary: isDarkMode ? '#334155' : '#e9ecef',
      card: isDarkMode ? '#1e293b' : '#ffffff',
      input: isDarkMode ? '#0f172a' : '#ffffff'
    },
    text: {
      primary: isDarkMode ? '#ffffff' : '#2c3e50',
      secondary: isDarkMode ? '#cbd5e1' : '#7f8c8d',
      muted: isDarkMode ? '#94a3b8' : '#95a5a6'
    },
    border: {
      default: isDarkMode ? '#334155' : '#dee2e6',
      hover: isDarkMode ? '#475569' : '#cbd5e1',
      light: isDarkMode ? '#334155' : '#dee2e6'
    },
    accent: {
      primary: '#c0392b'
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};


