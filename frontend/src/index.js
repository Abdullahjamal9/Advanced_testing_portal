import React from 'react';
import ReactDOM from 'react-dom/client';
import TestingModule from './TestingModule';
import { ThemeProvider } from './contexts/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <TestingModule />
    </ThemeProvider>
  </React.StrictMode>
);


