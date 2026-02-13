// Use environment variable in production, fallback to localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const $get = async (path) => {
  const r = await fetch(`${API_BASE_URL}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
};
const $send = async (path, method, body) => {
  const r = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(txt || `${r.status} ${r.statusText}`);
  }
  return r.json();
};

export const getEmployees = () => $get('/api/employees');
export const createEmployee = (data) => $send('/api/employees', 'POST', data);
export const updateEmployee = ({ ID, Name }) => $send(`/api/employees/${encodeURIComponent(ID)}`, 'PUT', { Name });
export const deleteEmployee = (ID) => $send(`/api/employees/${encodeURIComponent(ID)}`, 'DELETE');

export const getStandards = () => $get('/api/standards');
export const getInfo = (standard) => $get(`/api/info?standard=${encodeURIComponent(standard)}`);
export const getQuestions = (standard) => $get(`/api/questions?standard=${encodeURIComponent(standard)}`);

export const getResults = () => $get('/api/results');
export const saveResult = (payload) => $send('/api/results', 'POST', payload);

export default { API_BASE_URL };


