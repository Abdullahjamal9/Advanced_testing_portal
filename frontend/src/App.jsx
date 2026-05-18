import React from 'react';
import TestingModule from './TestingModule';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <TestingModule />
    </ThemeProvider>
  );
}


