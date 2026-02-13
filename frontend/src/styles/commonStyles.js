// src/shared/commonStyles.js
const commonStyles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    padding: '30px',
    textAlign: 'center',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '28px',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #ecf0f1',
    borderRadius: '4px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '20px',
    color: '#3498db',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9em',
    color: '#2c3e50',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    color: '#7f8c8d',
    fontWeight: 'bold',
    borderBottom: '2px solid #dee2e6',
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid #eee',
  },
};

export default commonStyles;


