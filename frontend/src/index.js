import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

if (typeof document !== 'undefined') {
  const setOpenState = (selectEl, isOpen) => {
    if (!(selectEl instanceof HTMLSelectElement)) return;
    if (isOpen) {
      selectEl.setAttribute('data-open', 'true');
    } else {
      selectEl.removeAttribute('data-open');
    }
  };

  document.addEventListener('mousedown', (event) => {
    const selectEl = event.target?.closest?.('select');
    if (!selectEl) return;

    if (selectEl.hasAttribute('data-open')) {
      // Second click closes: remove open state and blur so radius resets.
      requestAnimationFrame(() => {
        setOpenState(selectEl, false);
        selectEl.blur();
      });
      return;
    }

    setOpenState(selectEl, true);
  });

  document.addEventListener('keydown', (event) => {
    const selectEl = event.target;
    if (!(selectEl instanceof HTMLSelectElement)) return;

    if ([' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      setOpenState(selectEl, true);
      return;
    }

    if (event.key === 'Escape') {
      setOpenState(selectEl, false);
      selectEl.blur();
    }
  });

  document.addEventListener('change', (event) => {
    const selectEl = event.target;
    if (!(selectEl instanceof HTMLSelectElement)) return;
    setOpenState(selectEl, false);
    selectEl.blur();
  });

  document.addEventListener('blur', (event) => {
    const selectEl = event.target;
    if (!(selectEl instanceof HTMLSelectElement)) return;
    setOpenState(selectEl, false);
  }, true);
}


