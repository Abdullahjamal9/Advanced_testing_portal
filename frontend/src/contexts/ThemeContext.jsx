import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ptis_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('ptis_theme', isDarkMode ? 'dark' : 'light');
    // Apply background color to body
    document.body.style.backgroundColor = isDarkMode ? '#1a1a2e' : '#ffffff';
    document.body.style.color = isDarkMode ? '#ffffff' : '#1a1a2e';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    // Background colors
    bg: {
      primary: isDarkMode ? '#1a1a2e' : '#ffffff',
      secondary: isDarkMode ? '#16213e' : '#f5f6f7',
      tertiary: isDarkMode ? '#0f1419' : '#ecf0f1',
      card: isDarkMode ? '#1a1a2e' : '#ffffff',
      hover: isDarkMode ? '#252b42' : '#f8f9fa',
      input: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    },
    // Text colors
    text: {
      primary: isDarkMode ? '#ffffff' : '#1a1a2e',
      secondary: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#7f8c8d',
      muted: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#95a5a6',
      inverse: isDarkMode ? '#1a1a2e' : '#ffffff',
    },
    // Border colors
    border: {
      default: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
      light: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ecf0f1',
      dark: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#bdc3c7',
    },
    // Accent colors (stay same)
    accent: {
      primary: '#c0392b',
      secondary: '#e74c3c',
      gradient: 'linear-gradient(120deg, #c0392b, #e74c3c)',
      light: '#ff8a8a',
    },
    // Status colors
    status: {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db',
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


