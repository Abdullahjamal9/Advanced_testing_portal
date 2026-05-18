const listeners = new Set();
let toasts = [];

const notify = () => {
  listeners.forEach((listener) => listener(toasts));
};

const getToastsSnapshot = () => toasts;

const subscribeToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const addToast = (toast) => {
  toasts = [...toasts, toast];
  notify();
};

const removeToast = (id) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  notify();
};

export {
  addToast,
  removeToast,
  subscribeToasts,
  getToastsSnapshot
};
