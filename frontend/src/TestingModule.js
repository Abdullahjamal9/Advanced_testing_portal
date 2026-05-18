import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LogIn,
  User,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Settings,
  Home,
  Users,
  BarChart3,
  Shield,
  AlertCircle,
  Loader,
  RefreshCw,
  Download,
  BookOpen,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  FileCheck,
  Moon,
  Sun,
  Search,
  Info
} from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import StandardsAdminPage from './admin/StandardsAdminPage';
import QuestionsAdminPage from './admin/QuestionsAdminPage';
import ptisLogo from './assets/ptisLogo.png';
import './LoginPage.css';
import { addToast, removeToast, subscribeToasts, getToastsSnapshot } from './utils/toastStore';

// Toast Notification Component
const Toast = ({ message, type = 'info', onClose, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto close after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
    const baseStyles = {
      position: 'fixed',
      top: isNarrowViewport ? '12px' : '20px',
      right: isVisible ? (isNarrowViewport ? '12px' : '20px') : '-400px',
      zIndex: 999999,
      minWidth: isNarrowViewport ? 'calc(100vw - 24px)' : '300px',
      maxWidth: isNarrowViewport ? 'calc(100vw - 24px)' : '450px',
      padding: '12px 16px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid',
    };

    const types = {
      success: {
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
        borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.5)',
        color: isDarkMode ? '#ffffff' : '#ffffff',
        icon: <CheckCircle size={20} />,
      },
      error: {
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
        borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.5)',
        color: isDarkMode ? '#ffffff' : '#ffffff',
        icon: <XCircle size={20} />,
      },
      info: {
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)',
        borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.5)',
        color: isDarkMode ? '#ffffff' : '#ffffff',
        icon: <Info size={20} />,
      },
      loading: {
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.95) 0%, rgba(147, 51, 234, 0.95) 100%)',
        borderColor: isDarkMode ? 'rgba(168, 85, 247, 0.6)' : 'rgba(168, 85, 247, 0.5)',
        color: isDarkMode ? '#ffffff' : '#ffffff',
        icon: <Loader size={20} className="spin-animation" />,
      },
    };

    const typeStyle = types[type] || types.info;

    return {
      ...baseStyles,
      background: typeStyle.background,
      borderColor: typeStyle.borderColor,
      color: typeStyle.color,
      icon: typeStyle.icon,
    };
  };

  const styles = getToastStyles();

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div style={styles}>
        <div style={{ flexShrink: 0 }}>
          {styles.icon}
        </div>
        <div style={{ flex: 1, lineHeight: '1.4' }}>
          {message}
        </div>
      </div>
    </>
  );
};

const ToastHost = ({ isDarkMode }) => {
  const [toasts, setToasts] = useState(() => getToastsSnapshot());

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          isDarkMode={isDarkMode}
        />
      ))}
    </>
  );
};

// HomePage Component - Moved outside to prevent re-creation
const HomePage = React.memo(({ 
  activeLoginForm, 
  setActiveLoginForm,
  selectedEmployee,
  setSelectedEmployee,
  employeeName,
  selectedStandard,
  handleStandardSelect,
  testInfo,
  standards,
  employees,
  dataLoaded,
  loading,
  handleStartTest,
  adminPassword,
  setAdminPassword,
  showPassword,
  setShowPassword,
  handleAdminLogin,
  error,
  idInputRef,
  fillEmployeeNameFromTypedId,
  showToast
}) => (
  <div className="login-backdrop">
    <div className="login-backdrop-grid"></div>
    <div className="login-main-container">
      {/* Left Side - Branding */}
      <div className="login-right-container">
        <div className="orbit-ring"></div>
        <div className="orbit-ring-2"></div>
        <div className="glow-pulse"></div>
        
        <div className="branding-content">
          <div className="logo-wrapper">
            <img src={ptisLogo} alt="PTIS Logo" className="ptis-logo" />
          </div>
          
          <h1 className="branding-title">
            Premier Tubular Inspection Services
          </h1>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-container">
        <span className="session-chip">SECURE SESSION</span>
        
        <h2 className="form-title">Welcome back</h2>
        <p className="form-subtitle">
          {activeLoginForm === 'employee' 
            ? 'Authenticate To Enter The PTIS Testing Portal.'
            : 'Authenticate To Enter The PTIS Test Management Portal.'
          }
        </p>

        {/* User/Admin Tabs */}
        <div className="login-type-selector">
          <button
            className={`type-option ${activeLoginForm === 'employee' ? 'active' : ''}`}
            onClick={() => setActiveLoginForm('employee')}
          >
            User
          </button>
          <button
            className={`type-option ${activeLoginForm === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveLoginForm('admin')}
          >
            Admin
          </button>
        </div>

        {/* Employee Login Form */}
        {activeLoginForm === 'employee' && (
          <div key="employee-form">
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                ref={idInputRef}
                type="text"
                className="form-input"
                placeholder={employees.length === 0 ? 'Loading employees...' : 'Enter your Employee ID'}
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    fillEmployeeNameFromTypedId(e.currentTarget.value);
                  }
                }}
                autoComplete="off"
                disabled={!dataLoaded}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee Name</label>
              <input
                type="text"
                className="form-input"
                value={employeeName}
                readOnly
                style={{ 
                  opacity: 1, 
                  cursor: 'default',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Test Standard</label>
              <select
                className="form-input"
                value={selectedStandard}
                onChange={(e) => handleStandardSelect(e.target.value)}
                disabled={!dataLoaded}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)' }}
              >
                <option value="">{standards.length === 0 ? 'Loading standards...' : 'Select Standard'}</option>
                {standards.map(std => (
                  <option key={std.Standard_List} value={std.Standard_List}>{std.Standard_List}</option>
                ))}
              </select>
            </div>

            {testInfo && (
              <div className="test-info-display">
                <p><strong>Questions:</strong> {testInfo.Total_Questions} | <strong>Pass Mark:</strong> {testInfo.Passing_Criteria}</p>
                <p><strong>Time Limit:</strong> {testInfo.hours || 0}h {testInfo.minutes || 0}m {testInfo.seconds || 0}s</p>
                {(() => {
                  const currentStandard = standards.find(s => s.Standard_List === selectedStandard);
                  const hasNegativeMarking = currentStandard?.Negative_Marking === 'Yes' || 
                                             currentStandard?.Negative_Marking === 'yes';
                  return hasNegativeMarking ? (
                    <p style={{ 
                      color: '#ff8a8a', 
                      marginTop: '8px',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <AlertCircle size={16} style={{ marginRight: '6px', flexShrink: 0 }} />
                      <span>Negative Marking: -0.25 Per Wrong Answer</span>
                    </p>
                  ) : null;
                })()}
              </div>
            )}

            <div className="forgot-link">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Contact Admin: +92-21-34559070 or +92-21-34533739', 'info');
                }}
              >
                Need Help?
              </a>
            </div>

            <button
              className="login-btn"
              onClick={handleStartTest}
              disabled={!selectedEmployee || !selectedStandard || loading}
            >
              {loading ? 'Loading...' : 'Start Test'}
            </button>
          </div>
        )}

        {/* Admin Login Form */}
        {activeLoginForm === 'admin' && (
          <form
            key="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAdminLogin();
            }}
          >
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  name="admin-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="off"
                  style={{ paddingRight: '45px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="forgot-link">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Contact System Administrator for Password Reset', 'info');
                }}
              >
                Need Help?
              </a>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !adminPassword}
            >
              {loading ? 'Authenticating...' : 'Admin Login'}
            </button>
          </form>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: '8px',
            color: '#e74c3c',
            fontSize: '0.9em',
            marginTop: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  </div>
));

const TestingModule = () => {
  const API_BASE_URL = useMemo(() => {
    const envBase = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
    if (envBase) return envBase;

    // In CRA dev, keep empty base to use package.json proxy.
    if (process.env.NODE_ENV === 'development') return '';

    // In shared/deployed static hosting, fall back to same host on backend port.
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }

    return '';
  }, []);
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const contentMaxWidth = isTablet ? '100%' : '1200px';
  const twoColumnGrid = isMobile ? '1fr' : '1fr 1fr';
  const dashboardFourCol = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)';
  const dashboardTwoCol = isMobile ? '1fr' : 'repeat(2, 1fr)';

  // Toast Helper Function
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    addToast({ id, message, type });
  }, []);

  // State
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('ptis_current_page');
    const savedAdminState = localStorage.getItem('ptis_admin_logged_in');
    return savedAdminState === 'true' && savedPage === 'admin' ? 'admin' : 'home';
  });
  const [employees, setEmployees] = useState([]);
  const [standards, setStandards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [skipped, setSkipped] = useState([]);
  const [isReviewingSkipped, setIsReviewingSkipped] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    const savedAdminState = localStorage.getItem('ptis_admin_logged_in');
    return savedAdminState === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [activeLoginForm, setActiveLoginForm] = useState('employee'); // 'employee' or 'admin'
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard'); // 'dashboard', 'results', 'standards', 'questions', 'employees'
  
  // --- Add/Update Employee states (Admin)
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [empSaving, setEmpSaving] = useState(false);
  const [empMsg, setEmpMsg] = useState('');

  // --- Certificate filters
  const [certFilterId, setCertFilterId] = useState('');
  const [certFilterName, setCertFilterName] = useState('');

  // Dark mode colors
  const colors = {
    pageBg: isDarkMode ? '#0f172a' : '#ecf0f1',
    cardBg: isDarkMode ? '#1e293b' : 'white',
    cardAltBg: isDarkMode ? '#0f172a' : '#f8f9fa',
    border: isDarkMode ? '#334155' : '#e9ecef',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    textMuted: isDarkMode ? '#d1d5db' : '#7f8c8d',
    inputBg: isDarkMode ? '#0f172a' : 'white',
    inputBorder: isDarkMode ? '#334155' : '#dee2e6',
    tableHeaderBg: '#0F172A',
    tableRowBg: '#2d3748',
    rowHover: isDarkMode ? '#3d4a5a' : '#f8f9fa',
    modalBg: isDarkMode ? '#1e293b' : 'white',
    modalOverlay: 'rgba(26, 26, 46, 0.85)'
  };

  // Debug
  useEffect(() => {
    console.log('State updated - isAdmin:', isAdmin, 'currentPage:', currentPage, 'results length:', results.length);
  }, [isAdmin, currentPage, results]);

  // Utils
  const shuffle = (array) => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    while (currentIndex !== 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }
    return shuffled;
  };

  const fetchData = useCallback(async (endpoint) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`);
      if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
      const data = await response.json();
      console.log(`Fetched data for ${endpoint}:`, data);
      return data;
    } catch (err) {
      setError(`Failed to fetch ${endpoint}: ${err.message}`);
      console.error(`Error fetching ${endpoint}:`, err);
      return [];
    }
  }, []);

  const normalizeStandard = (s) =>
    (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const getPakistanDateTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(now);
    const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    const month = map.month;
    const day = map.day;
    const year = map.year;
    const hour = map.hour;
    const minute = map.minute;
    const second = map.second;
    const ampm = (map.dayPeriod || '').toUpperCase();

    return `${day}-${month}-${year} ${hour}:${minute}:${second} ${ampm}`;
  };

  const getPakistanDateTimeInputs = (dateValue = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(dateValue);
    const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    return {
      dateInput: `${map.year}-${map.month}-${map.day}`,
      timeInput: `${map.hour}:${map.minute}`,
    };
  };

  const parseResultDateTimeInputs = (dateTimeValue) => {
    const defaults = getPakistanDateTimeInputs();
    const rawValue = String(dateTimeValue || '').trim();
    if (!rawValue) return defaults;

    const match12Hour = rawValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i
    );

    if (match12Hour) {
      const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw, periodRaw] = match12Hour;
      let hour24 = parseInt(hourRaw, 10);
      const period = periodRaw.toUpperCase();

      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;

      return {
        dateInput: `${yearRaw}-${monthRaw.padStart(2, '0')}-${dayRaw.padStart(2, '0')}`,
        timeInput: `${String(hour24).padStart(2, '0')}:${minuteRaw}`,
      };
    }

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return getPakistanDateTimeInputs(parsed);
    }

    return defaults;
  };

  const composeResultDateTime = (dateInput, timeInput) => {
    if (!dateInput || !timeInput) return '';

    const [year, month, day] = dateInput.split('-');
    const [hourRaw, minuteRaw] = timeInput.split(':');

    const hour24 = parseInt(hourRaw, 10);
    const minute = parseInt(minuteRaw, 10);

    if (!year || !month || !day || !Number.isFinite(hour24) || !Number.isFinite(minute)) {
      return '';
    }

    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${day}-${month}-${year} ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00 ${period}`;
  };

  // Initial data
  const loadInitialData = async () => {
    setLoading(true);
    const [employeesData, standardsData] = await Promise.all([
      fetchData('/employees'),
      fetchData('/standards'),
    ]);
    setEmployees(employeesData || []);
    setStandards(standardsData || []);
    setDataLoaded(true);
    setLoading(false);
  };

  const fetchTestInfo = async (standard) => {
    const enc = encodeURIComponent(standard);
    const data = await fetchData(`/info?standard=${enc}`);
    if (!data || Array.isArray(data) || !data.Total_Questions) {
      console.error('Invalid test info response:', data);
      setError('Failed to load test information. Please try again.');
      return null;
    }
    setTestInfo(data);
    const totalSeconds =
      (data.hours || 0) * 3600 +
      (data.minutes || 0) * 60 +
      (data.seconds || 0);
    setTimeRemaining(totalSeconds);
    return data;
  };

  const fetchQuestions = async (standard, testInfoLocal) => {
    const enc = encodeURIComponent(standard);
    const data = await fetchData(`/questions?standard=${enc}`);
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Invalid questions response:', data);
      setError('Failed to load questions. Please try again.');
      setQuestions([]);
      setOriginalQuestions([]);
      return;
    }
    let processedData = [...data];

    const dedupeQuestions = (items) => {
      const seen = new Set();
      const unique = [];
      for (const item of items) {
        const key = String(item?.Question || '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
      }
      return unique;
    };

    const stdNorm = normalizeStandard(standard);
    const isCumulative = stdNorm.includes('cumulative') || stdNorm.includes('cummulative');

    if (isCumulative) {
      let allQuestions = [];
      for (const st of standards) {
        const stData = await fetchData(`/questions?standard=${encodeURIComponent(st.Standard_List)}`);
        allQuestions = [...allQuestions, ...stData];
      }
      processedData = shuffle(dedupeQuestions(allQuestions)).slice(0, 50);
    } else {
      if (processedData.length > 0) {
        processedData = shuffle(dedupeQuestions(processedData));
      }
    }

    if (testInfoLocal && testInfoLocal.Total_Questions && testInfoLocal.Total_Questions < processedData.length) {
      processedData = processedData.slice(0, testInfoLocal.Total_Questions);
    }

    setQuestions(processedData);
    setOriginalQuestions(processedData);
  };

  // Events
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    const employee = employees.find(emp => emp.ID.toString() === employeeId);
    setEmployeeName(employee ? employee.Name : '');
  };

  const handleStandardSelect = async (standard) => {
    setSelectedStandard(standard);
    if (standard) {
      const testInfoData = await fetchTestInfo(standard);
      await fetchQuestions(standard, testInfoData);
    }
  };

  // Fills employeeName from the typed ID without touching focus
  const fillEmployeeNameFromTypedId = (id) => {
    const emp = employees.find(e => e.ID?.toString() === (id ?? '').toString());
    setEmployeeName(emp ? emp.Name : '');
  };

  // ---- Focus guard for Employee ID input (prevents focus loss on re-renders)
  const idInputRef = useRef(null);
  const isCompletingTestRef = useRef(false);

  const handleStartTest = () => {
    if (!selectedEmployee || !selectedStandard) {
      setError('Please select both employee and standard');
      showToast('Please select both employee and standard', 'error');
      return;
    }
    if (!testInfo || !questions.length) {
      setError('Test information or questions not loaded. Please try again.');
      showToast('Test information or questions not loaded. Please try again.', 'error');
      return;
    }

    setCurrentPage('test');
    setTestStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setAttemptedCount(0);
    setSkipped([]);
    setIsReviewingSkipped(false);
    setTestCompleted(false);
    isCompletingTestRef.current = false;
    setSelectedAnswer(null);
    setError('');
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const question = questions[currentQuestion];
    if (!question || !selectedAnswer) return;

    // Save current answer immediately
    const updatedAnswers = { ...answers, [question.NO]: selectedAnswer };
    setAnswers(updatedAnswers);
    setAttemptedCount(prev => prev + 1);

    let newSkipped = skipped;
    if (skipped.includes(question.NO)) {
      newSkipped = skipped.filter(no => no !== question.NO);
      setSkipped(newSkipped);
    }

    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      if (newSkipped.length > 0 && !isReviewingSkipped) {
        const skippedQuestions = originalQuestions.filter(q =>
          newSkipped.includes(q.NO) && !updatedAnswers[q.NO]
        );

        if (skippedQuestions.length > 0) {
          setQuestions(skippedQuestions);
          setCurrentQuestion(0);
          setIsReviewingSkipped(true);
          return;
        }
      }
      // All questions answered - complete test with updated answers
      handleTestComplete(updatedAnswers);
    }
  };

  const handleSkipQuestion = () => {
    if (isReviewingSkipped) return;

    const question = questions[currentQuestion];
    if (!question) return;

    let newSkipped = skipped;
    if (!skipped.includes(question.NO)) {
      newSkipped = [...skipped, question.NO];
      setSkipped(newSkipped);
    }

    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleEndOfQuestions(newSkipped);
    }
  };

  const handleEndOfQuestions = (skippedList = skipped) => {
    if (skippedList.length > 0 && !isReviewingSkipped) {
      const skippedQuestions = originalQuestions.filter(q =>
        skippedList.includes(q.NO) && !answers[q.NO]
      );

      if (skippedQuestions.length > 0) {
        setQuestions(skippedQuestions);
        setCurrentQuestion(0);
        setIsReviewingSkipped(true);
        setSelectedAnswer(null);
        return;
      }
    }
    if (skipped.length === 0) {
      handleTestComplete();
    }
  };

  const handleTestComplete = async (finalAnswers = null) => {
    if (isCompletingTestRef.current) {
      console.log('Test completion already in progress. Ignoring duplicate trigger.');
      return;
    }

    isCompletingTestRef.current = true;
    setTestStarted(false);
    setTestCompleted(true);

    // Use provided answers or fall back to state
    const answersToUse = finalAnswers || answers;

    let right = 0;
    let wrong = 0;
    let unanswered = 0;
    const totalQuestions = originalQuestions.length;

    originalQuestions.forEach(q => {
      if (answersToUse[q.NO]) {
        if (answersToUse[q.NO] === q.Answer) {
          right++;
        } else {
          wrong++;
        }
      } else {
        unanswered++;
      }
    });

    // Check if negative marking is enabled for this standard
    const currentStandard = standards.find(s => s.Standard_List === selectedStandard);
    const hasNegativeMarking = currentStandard?.Negative_Marking === 'Yes' || 
                               currentStandard?.Negative_Marking === 'yes';

    // Apply negative marking only if enabled
    const rawScore = hasNegativeMarking ? right - (wrong * 0.25) : right;
    const finalScore = Math.max(0, rawScore);
    const percentage = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;
    const status = percentage >= (testInfo?.Passing_Criteria || 75) ? 'Pass' : 'Fail';

    // Use STANDARD consistently (DB column is STANDARD)
    const result = {
      ID: selectedEmployee,
      NAME: employeeName,
      TOTAL_QUESTION: totalQuestions,
      CORRECT_ANSWER: right,
      WRONG_ANSWER: wrong,
      PERCENTAGE: `${percentage.toFixed(2)}%`,
      PASSING_CRITERIA: String(testInfo?.Passing_Criteria || 75).includes('%')
        ? String(testInfo?.Passing_Criteria)
        : `${testInfo?.Passing_Criteria || 75}%`,
      STATUS: status,
      STANDARD: selectedStandard,
      DATE: getPakistanDateTime(),
      FINAL_SCORE: finalScore.toFixed(2), // client-side only display
      answers: answersToUse,  // Add answers (use finalAnswers if provided)
      questions: originalQuestions  // Add questions for PDF
    };

    console.log('Test Completion Details:');
    console.log('  Total Questions:', totalQuestions);
    console.log('  Correct:', right);
    console.log('  Wrong:', wrong);
    console.log('  Unanswered:', unanswered);
    console.log('  Answers object:', answersToUse);

    setTestResult(result);

    console.log('Saving Result:', result);
    const saveSuccess = await saveResult(result);
    if (saveSuccess) {
      console.log('Result Saved Successfully');
      await loadResults();
    } else {
      setError('Failed to Save Test Result to Database. Please Try Again.');
    }

    setCurrentPage('result');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'AdminPtis-3692') {
      setIsAdmin(true);
      setCurrentPage('admin');
      localStorage.setItem('ptis_admin_logged_in', 'true');
      localStorage.setItem('ptis_current_page', 'admin');
      setError('');
      loadResults(true);
      setAdminPassword('');
      showToast('Admin login successful!', 'success');
    } else {
      setError('Invalid Admin Password');
      showToast('Invalid Admin Password', 'error');
    }
  };

  const getResultRowSignature = (row = {}) => [
    row.ID ?? '',
    row.NAME ?? '',
    row.STANDARD ?? '',
    row.DATE ?? '',
    row.STATUS ?? '',
    row.PERCENTAGE ?? '',
    row.TOTAL_QUESTION ?? '',
    row.CORRECT_ANSWER ?? '',
    row.WRONG_ANSWER ?? '',
    row.HAS_PRACTICAL_ATTACHMENT ?? '',
    row.PRACTICAL_ATTACHMENT_NAME ?? '',
  ].join('|');

  const areResultListsEqual = (prevResults = [], nextResults = []) => {
    if (prevResults.length !== nextResults.length) return false;

    for (let i = 0; i < prevResults.length; i++) {
      if (getResultRowSignature(prevResults[i]) !== getResultRowSignature(nextResults[i])) {
        return false;
      }
    }

    return true;
  };

  const loadResults = useCallback(async (showLoader = false) => {
    if (showLoader) setAdminLoading(true);

    const resultsData = await fetchData('/results');

    // Parse "DD-MM-YYYY hh:mm:ss AM/PM" (Asia/Karachi) to a sortable epoch number
    const toEpochFromPk = (s) => {
      const m = (s ?? '').match(
        /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+(AM|PM)/
      );
      if (!m) return 0;

      let [, dd, mm, yyyy, hh, mi, ss, ampm] = m;
      dd = +dd;
      mm = +mm - 1;          // JS months 0-11
      yyyy = +yyyy;
      hh = (+hh % 12) + (ampm === 'PM' ? 12 : 0); // 12-hour -> 24-hour

      // Convert PKT (UTC+5) to UTC epoch for consistent sorting
      return Date.UTC(yyyy, mm, dd, hh - 5, +mi, +ss);
    };

    // Ascending so the oldest appears first; tie-breakers keep order deterministic.
    resultsData.sort((a, b) => {
      const epochDiff = toEpochFromPk(a.DATE) - toEpochFromPk(b.DATE);
      if (epochDiff !== 0) return epochDiff;

      const aKey = `${a.ID ?? ''}|${a.STANDARD ?? ''}|${a.NAME ?? ''}`;
      const bKey = `${b.ID ?? ''}|${b.STANDARD ?? ''}|${b.NAME ?? ''}`;
      return aKey.localeCompare(bKey);
    });

    console.log('Loaded results:', resultsData);
    setResults((prevResults) =>
      areResultListsEqual(prevResults, resultsData) ? prevResults : resultsData
    );
    if (showLoader) setAdminLoading(false);
  }, [fetchData]);

  // Keep results fresh while admin is actively viewing the Test Results tab.
  useEffect(() => {
    if (!(isAdmin && currentPage === 'admin' && adminActiveTab === 'results')) return;

    const intervalId = setInterval(() => {
      loadResults(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isAdmin, currentPage, adminActiveTab, loadResults]);

  const saveResult = async (resultData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData) // sends STANDARD
      });
      if (!response.ok) {
        throw new Error(`Failed to Save Result: ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log('Save Result Response:', responseData);
      showToast('Test result saved successfully!', 'success');
      return true;
    } catch (err) {
      setError('Failed to Save Result to Database: ' + err.message);
      console.error('Error Saving Result:', err);
      showToast('Failed to save test result to database', 'error');
      return false;
    }
  };

  // // --- Add/Update Employee API
  // const addOrUpdateEmployee = async ({ ID, NAME }) => {
  //   const id = (ID ?? '').trim();
  //   const name = (NAME ?? '').trim();
  //   if (!id || !name) {
  //     setEmpMsg('Failed: Employee ID and Name are required.');
  //     return;
  //   }
  //   setEmpSaving(true);
  //   setEmpMsg('');
  //   try {
  //     // Expecting backend to upsert (insert or update) using { ID, Name }
  //     const resp = await fetch(`${API_BASE_URL}/api/employees`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ ID: id, Name: name })
  //     });
  //     if (!resp.ok) {
  //       const t = await resp.text().catch(() => '');
  //       throw new Error(t || `HTTP ${resp.status}`);
  //     }
  //     // Optimistically update local employees array so Home page works immediately
  //     setEmployees(prev => {
  //       const exists = prev.some(e => String(e.ID) === String(id));
  //       if (exists) {
  //         return prev.map(e => String(e.ID) === String(id) ? { ...e, Name: name } : e);
  //       }
  //       return [...prev, { ID: id, Name: name }];
  //     });
  //     setEmpMsg('Employee saved successfully.');
  //     setNewEmpId('');
  //     setNewEmpName('');
  //   } catch (e) {
  //     console.error('Add/Update employee error:', e);
  //     setEmpMsg(`Failed: ${e.message}`);
  //   } finally {
  //     setEmpSaving(false);
  //   }
  // };

  // --- Employee CRUD API helpers ---
  const createEmployee = async ({ ID, Name }) => {
    const resp = await fetch(`${API_BASE_URL}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ID, Name })
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  };

  const deleteEmployee = async (ID) => {
    const resp = await fetch(`${API_BASE_URL}/api/employees/${encodeURIComponent(ID)}`, {
      method: 'DELETE'
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  };


  // Timer
  useEffect(() => {
    let interval;
    if (testStarted && !testCompleted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, timeRemaining, testCompleted]);

  useEffect(() => {
    if (testStarted && !testCompleted && timeRemaining === 0) {
      handleTestComplete();
    }
  }, [testStarted, testCompleted, timeRemaining]);

  const formatTime = (seconds) => {
    const s = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Styles
  const commonStyles = {
    card: {
      backgroundColor: '#fff',
      borderRadius: '18px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      padding: isMobile ? '20px' : '30px',
      textAlign: 'center'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#1a1a2e',
      color: '#fff',
      border: 'none',
      borderRadius: '28px',
      fontSize: '1em',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    buttonRed: {
      padding: '12px 24px',
      background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
      color: '#fff',
      border: 'none',
      borderRadius: '28px',
      fontSize: '1em',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '2px solid #bdc3c7',
      borderRadius: '28px',
      fontSize: '1em',
      boxSizing: 'border-box'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '20px',
      color: '#1a1a2e'
    },
    error: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '15px',
      backgroundColor: '#fadbd8',
      color: '#c0392b',
      borderRadius: '28px',
      marginBottom: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.9em',
      color: '#1a1a2e'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      color: colors.text,
      fontWeight: 'bold',
      borderBottom: '3px solid #c0392b',
      backgroundColor: colors.cardAltBg
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text
    }
  };

  const TestPage = () => {
    if (!questions.length || !testInfo) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: theme.bg.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={commonStyles.loading}>
            <Loader size={24} />Loading test...
          </div>
        </div>
      );
    }

    const question = questions[currentQuestion];
    const wasSkipped = question ? skipped.includes(question.NO) : false;
    const isLastQuestion = currentQuestion === questions.length - 1;
    const remainingSkipped = isReviewingSkipped ? questions.length - currentQuestion : skipped.length;

    return (
      <div style={{ minHeight: '100vh', height: '100%', backgroundColor: theme.bg.secondary, paddingTop: '80px' }}>
        <div style={{ 
          backgroundColor: '#1a1a2e', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)', 
          borderBottom: '3px solid #c0392b',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: isMobile ? '12px' : '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '10px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '25px',
                padding: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={ptisLogo} 
                  alt="PTIS Logo" 
                  style={{ 
                    width: '35px', 
                    height: '35px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <h1 style={{ fontSize: isMobile ? '1.2em' : '1.5em', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                PTIS Test
              </h1>
              <span style={{ background: 'linear-gradient(120deg, #c0392b, #e74c3c)', color: '#fff', padding: '5px 15px', borderRadius: '28px', fontSize: '0.9em', fontWeight: 'bold' }}>
                {selectedStandard}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px', flexWrap: isMobile ? 'wrap' : 'nowrap', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '28px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#fff',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span style={{ fontSize: '0.9em' }}>{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <Clock size={20} />
                <span style={{ fontFamily: 'monospace', fontSize: isMobile ? '1em' : '1.2em', fontWeight: 'bold' }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: isMobile ? '5px 10px' : '5px 15px', borderRadius: '28px', fontSize: isMobile ? '0.8em' : '0.9em' }}>
                {isReviewingSkipped
                  ? `Review ${currentQuestion + 1} of ${questions.length} skipped`
                  : `Question ${currentQuestion + 1} of ${originalQuestions.length} (Attempted: ${attemptedCount})`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: isMobile ? '20px 12px' : '30px 20px' }}>
          {isReviewingSkipped && (
            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '15px', marginBottom: '25px', textAlign: 'center' }}>
              <AlertCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#856404' }} />
              <span style={{ color: '#856404', fontWeight: 'bold' }}>
                Reviewing Skipped Questions - You must answer these to complete the test
              </span>
            </div>
          )}

          {skipped.length > 0 && !isReviewingSkipped && (
            <div style={{ backgroundColor: '#fadbd8', border: '1px solid #c0392b', borderRadius: '8px', padding: '15px', marginBottom: '25px', textAlign: 'center' }}>
              <AlertCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#c0392b' }} />
              <span style={{ color: '#c0392b', fontWeight: 'bold' }}>
                {skipped.length} Questions Skipped. You Must Answer all Questions to Submit the Test.
              </span>
            </div>
          )}

          <div style={{ backgroundColor: theme.bg.card, borderRadius: '16px', boxShadow: `0 4px 20px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`, padding: isMobile ? '18px' : '30px', marginBottom: '25px', border: `1px solid ${theme.border.light}` }}>
            {question ? (
              <>
                <h2 style={{ fontSize: isMobile ? '1.15em' : '1.4em', fontWeight: '600', marginBottom: '25px', color: theme.text.primary, lineHeight: '1.4' }}>
                  {wasSkipped && !isReviewingSkipped && (
                    <span style={{ color: '#c0392b', fontSize: '0.8em', marginRight: '10px' }}>⏭ SKIPPED</span>
                  )}
                  <span style={{ color: theme.text.primary, fontWeight: 'bold' }}>Q{currentQuestion + 1}.</span> {question.Question}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Opt_A', 'Opt_B', 'Opt_C', 'Opt_D'].map((opt, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const isSelected = selectedAnswer === letter;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswerSelect(letter)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: isMobile ? '14px' : '18px',
                          border: `2px solid ${isSelected ? theme.accent.primary : theme.border.default}`,
                          borderRadius: '28px',
                          backgroundColor: isSelected ? (isDarkMode ? 'rgba(192, 57, 43, 0.2)' : '#ecf0f1') : theme.bg.card,
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: isMobile ? '10px' : '15px',
                          cursor: 'pointer',
                          fontSize: '1em'
                        }}
                      >
                        <span style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected ? theme.accent.primary : theme.bg.tertiary,
                          color: isSelected ? '#fff' : theme.text.muted,
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {letter}
                        </span>
                        <span style={{ color: theme.text.primary, fontSize: '1em', lineHeight: '1.4' }}>
                          {question[opt]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ color: theme.text.muted }}>No question available.</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <button
              onClick={handleSkipQuestion}
              disabled={isReviewingSkipped}
              style={{
                padding: '12px 20px',
                border: `2px solid ${theme.border.default}`,
                color: isReviewingSkipped ? theme.text.muted : theme.text.secondary,
                borderRadius: '28px',
                backgroundColor: theme.bg.card,
                opacity: isReviewingSkipped ? 0.5 : 1,
                cursor: isReviewingSkipped ? 'not-allowed' : 'pointer',
                fontSize: '1em',
                transition: 'all 0.3s ease'
              }}
            >
              {isReviewingSkipped ? 'Cannot Skip in Review' : 'Skip Question'}
            </button>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
                style={{
                  ...commonStyles.button,
                  background: selectedAnswer ? 'linear-gradient(120deg, #c0392b, #e74c3c)' : theme.border.default,
                  cursor: selectedAnswer ? 'pointer' : 'not-allowed'
                }}
              >
                {isLastQuestion && selectedAnswer && (skipped.length === 0 || isReviewingSkipped) ? 'Submit Test' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResultPage = () => {
    if (!testResult) return null;

    const resetTest = () => {
      setCurrentPage('home');
      setSelectedEmployee('');
      setEmployeeName('');
      setSelectedStandard('');
      setTestInfo(null);
      setQuestions([]);
      setOriginalQuestions([]);
      setAnswers({});
      setTestResult(null);
      setSkipped([]);
      setIsReviewingSkipped(false);
      setAttemptedCount(0);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setError('');
      setTestStarted(false);
      setTestCompleted(false);
      isCompletingTestRef.current = false;
    };

    const resultPassed = testResult.STATUS?.toUpperCase() === 'PASS';
    const resultPageBackground = isDarkMode
      ? 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #1f2937 100%)'
      : 'linear-gradient(135deg, #f5f6f5 0%, #e6f0fa 100%)';
    const statusPanelBg = isDarkMode
      ? (resultPassed ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.14)')
      : (resultPassed ? '#e8f5e8' : '#fadbd8');
    const statusPanelBorder = isDarkMode
      ? (resultPassed ? '1px solid rgba(46, 204, 113, 0.55)' : '1px solid rgba(231, 76, 60, 0.65)')
      : `2px solid ${resultPassed ? '#c8e6c9' : '#c0392b'}`;
    const statusPanelShadow = isDarkMode
      ? (resultPassed ? '0 0 20px rgba(46, 204, 113, 0.15)' : '0 0 20px rgba(231, 76, 60, 0.18)')
      : (resultPassed ? 'none' : '0 0 20px rgba(192, 57, 43, 0.2)');

    return (
      <div style={{ minHeight: '100vh', height: '100%', background: resultPageBackground }}>
        <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: isMobile ? '24px 12px' : '40px 20px' }}>
          <div style={{
            backgroundColor: colors.cardBg,
            borderRadius: '24px',
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.35)' : '0 8px 30px rgba(0,0,0,0.12)',
            padding: isMobile ? '22px 16px' : '40px',
            marginBottom: '30px',
            border: `1px solid ${theme.border.default}`
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              {resultPassed ? (
                <>
                  <CheckCircle size={80} color="#27ae60" style={{ marginBottom: '20px' }} />
                  <h1 style={{
                    fontSize: '2.5em',
                    fontWeight: 'bold',
                    color: '#27ae60',
                    margin: '0 0 10px',
                    textShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Congratulations!
                  </h1>
                  <p style={{ fontSize: '1.2em', color: theme.text.secondary, margin: 0 }}>
                    You Have Successfully Passed The Test
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={80} color="#c0392b" style={{ marginBottom: '20px' }} />
                  <h1 style={{
                    fontSize: '2.5em',
                    fontWeight: 'bold',
                    color: '#c0392b',
                    margin: '0 0 10px',
                    textShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Test Not Passed
                  </h1>
                  <p style={{ fontSize: '1.2em', color: theme.text.secondary, margin: 0 }}>
                    Please Review And Try Again
                  </p>
                </>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: twoColumnGrid,
              gap: isMobile ? '16px' : '30px',
              marginBottom: '40px'
            }}>
              <div style={{
                backgroundColor: colors.cardAltBg,
                borderRadius: '28px',
                padding: '25px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: theme.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <User size={24} color={theme.text.primary} />
                  Employee Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Employee ID:</span>
                    <span style={{ fontWeight: 'bold', color: theme.text.primary, fontSize: '1.1em' }}>
                      {testResult.ID}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Name:</span>
                    <span style={{ fontWeight: 'bold', color: theme.text.primary, fontSize: '1.1em' }}>
                      {testResult.NAME}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Test Standard:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: '#fff',
                      backgroundColor: isDarkMode ? '#1f2937' : '#1a1a2e',
                      border: `1px solid ${theme.border.default}`,
                      padding: '6px 12px',
                      borderRadius: '24px',
                      fontSize: '0.9em'
                    }}>
                      {testResult.STANDARD}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0'
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Test Date:</span>
                    <span style={{ fontWeight: 'bold', color: theme.text.primary, fontSize: '1.1em' }}>
                      {testResult.DATE}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: statusPanelBg,
                borderRadius: '28px',
                padding: '25px',
                border: statusPanelBorder,
                boxShadow: statusPanelShadow
              }}>
                <h3 style={{
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: theme.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <BarChart3 size={24} color={theme.text.primary} />
                  Test Results
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Total Questions:</span>
                    <span style={{ fontWeight: 'bold', color: theme.text.primary, fontSize: '1.2em' }}>
                      {testResult.TOTAL_QUESTION}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Correct Answers:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: '#27ae60',
                      fontSize: '1.2em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircle size={18} />
                      {testResult.CORRECT_ANSWER}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Wrong Answers:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: '#c0392b',
                      fontSize: '1.2em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <XCircle size={18} />
                      {testResult.WRONG_ANSWER}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: `1px solid ${colors.inputBorder}`
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '500' }}>Final Score:</span>
                    <span style={{ fontWeight: 'bold', color: theme.text.primary, fontSize: '1.1em' }}>
                      {testResult.FINAL_SCORE} / {testResult.TOTAL_QUESTION}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 0',
                    borderTop: `2px solid ${colors.inputBorder}`,
                    marginTop: '10px'
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: '600', fontSize: '1.1em' }}>
                      Percentage Score:
                    </span>
                    <span style={{
                      fontSize: '2.2em',
                      fontWeight: 'bold',
                      color: resultPassed ? '#27ae60' : '#e74c3c',
                      textShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {testResult.PERCENTAGE}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.9em',
                    color: colors.textMuted,
                    textAlign: 'center',
                    marginTop: '15px',
                    fontStyle: 'italic'
                  }}>
                    Pass Mark: {testResult.PASSING_CRITERIA}
                    {(() => {
                      const currentStandard = standards.find(s => s.Standard_List === testResult.STANDARD);
                      const hasNegativeMarking = currentStandard?.Negative_Marking === 'Yes' || 
                                                 currentStandard?.Negative_Marking === 'yes';
                      return hasNegativeMarking ? ' | Negative Marking: -0.25 Per Wrong Answer' : '';
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={resetTest}
                style={{
                  ...commonStyles.button,
                  fontSize: '1.2em',
                  padding: '15px 40px',
                  width: isMobile ? '100%' : 'auto',
                  background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                  boxShadow: '0 4px 15px rgba(192, 57, 43, 0.3)',
                  textTransform: 'none'
                }}
              >
                <Home size={22} />
                Take Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stable refs so memoized sub-components always read the latest outer-scope values
  // without relying on stale closure snapshots from a previous TestingModule render.
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const employeesRef = useRef(employees);
  employeesRef.current = employees;
  const standardsRef = useRef(standards);
  standardsRef.current = standards;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const isDarkModeRef = useRef(isDarkMode);
  isDarkModeRef.current = isDarkMode;
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const commonStylesRef = useRef(commonStyles);
  commonStylesRef.current = commonStyles;
  const adminActiveTabRef = useRef(adminActiveTab);
  adminActiveTabRef.current = adminActiveTab;
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  const adminLoadingRef = useRef(adminLoading);
  adminLoadingRef.current = adminLoading;

  // ---------- Admin Page (Professional Dashboard with Sidebar) ----------
  const AdminPage = useMemo(() => { return function AdminPageInner() {
    // Shadow outer-scope variables with fresh values from refs so this component
    // never remounts on parent state changes (avoids resetting modal/form state).
    const results = resultsRef.current;
    const employees = employeesRef.current;
    const standards = standardsRef.current;
    const theme = themeRef.current;
    const isDarkMode = isDarkModeRef.current;
    const isMobile = isMobileRef.current;
    const colors = colorsRef.current;
    const commonStyles = commonStylesRef.current;
    const adminActiveTab = adminActiveTabRef.current;
    const currentPage = currentPageRef.current;
    const isAdmin = isAdminRef.current;
    const adminLoading = adminLoadingRef.current;
    const norm = useCallback((v) => (v ?? '').toString().trim(), []);
    const normLower = useCallback((v) => norm(v).toLowerCase(), [norm]);
    const isPass = useCallback((status) => normLower(status) === 'pass', [normLower]);
    const toPctNumber = useCallback((p) => {
      const n = parseFloat((p ?? '').toString().replace('%', ''));
      return Number.isFinite(n) ? n : 0;
    }, []);

    // Build employee pairs exclusively from results (unique by ID)
    const employeePairs = useMemo(() => {
      const idToName = new Map();
      results.forEach(r => {
        const id = r?.ID != null ? String(r.ID) : '';
        const name = r?.NAME != null ? String(r.NAME) : '';
        if (id) {
          if (!idToName.has(id)) {
            idToName.set(id, name);
          }
        }
      });
      return Array.from(idToName.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));
    }, [results]);

    const employeeIdToName = useMemo(() => new Map(employeePairs), [employeePairs]);

    const employeeNameToId = useMemo(() => {
      const m = new Map();
      employeePairs.forEach(([id, name]) => {
        if (name && !m.has(name)) m.set(name, id);
      });
      return m;
    }, [employeePairs]);

    const employeeIdOptions = useMemo(() => employeePairs.map(([id]) => id), [employeePairs]);
    const employeeNameOptions = useMemo(() => {
      const s = new Set(employeePairs.map(([, name]) => name).filter(Boolean));
      return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [employeePairs]);

    const standardOptions = useMemo(() => {
      const set = new Set();
      results.forEach(r => { if (r.STANDARD) set.add(r.STANDARD); });
      return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [results]);

    // Filter state
    const [filterEmpId, setFilterEmpId] = useState('');
    const [filterEmpName, setFilterEmpName] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterStandard, setFilterStandard] = useState('All');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [resultsCurrentPage, setResultsCurrentPage] = useState(1);
    const [resultsGoToPage, setResultsGoToPage] = useState('');
    const resultsItemsPerPage = 50;
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showAddResultModal, setShowAddResultModal] = useState(false);
    const [resultSaving, setResultSaving] = useState(false);
    const [resultEditMode, setResultEditMode] = useState(false);
    const [resultEditTarget, setResultEditTarget] = useState(null);
    const [isResultPercentageManuallyEdited, setIsResultPercentageManuallyEdited] = useState(false);
    const [resultAttachmentFile, setResultAttachmentFile] = useState(null);
    const resultAttachmentInputRef = useRef(null);
    const createDefaultResultFormData = () => {
      const { dateInput, timeInput } = getPakistanDateTimeInputs();
      return {
        employeeId: '',
        employeeName: '',
        standard: '',
        totalQuestions: '100',
        correctAnswers: '',
        percentage: '',
        passingCriteria: '75',
        resultDate: dateInput,
        resultTime: timeInput
      };
    };
    const [resultFormData, setResultFormData] = useState(createDefaultResultFormData);

    const resultEmployeeIdOptions = useMemo(() => {
      const ids = new Set(employees.map(emp => String(emp.ID || '')).filter(Boolean));
      return Array.from(ids).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [employees]);

    const resultEmployeeNameOptions = useMemo(() => {
      const names = new Set(employees.map(emp => String(emp.Name || '')).filter(Boolean));
      return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [employees]);

    const resultStandardOptions = useMemo(() => {
      const std = new Set(standards.map(s => norm(s?.Standard_List)).filter(Boolean));
      return Array.from(std).sort((a, b) => a.localeCompare(b));
    }, [standards, norm]);

    const toResultDateKey = useCallback((value) => {
      const raw = norm(value);
      if (!raw) return '';

      const dateOnly = raw.split(' ')[0];
      const normalizeParts = (year, month, day) => {
        if (!year || !month || !day) return '';
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      };

      if (dateOnly.includes('/')) {
        const parts = dateOnly.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          return normalizeParts(parts[2], parts[1], parts[0]);
        }
      } else if (dateOnly.includes('-')) {
        const parts = dateOnly.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return normalizeParts(parts[0], parts[1], parts[2]);
          }
          if (parts[2].length === 4) {
            return normalizeParts(parts[2], parts[1], parts[0]);
          }
        }
      }

      const fallback = new Date(raw);
      if (!Number.isNaN(fallback.getTime())) {
        return normalizeParts(
          fallback.getFullYear(),
          fallback.getMonth() + 1,
          fallback.getDate()
        );
      }

      return '';
    }, [norm]);

    const isNegativeMarkingEnabledForStandard = useCallback((standardName) => {
      const normalizedStandardName = norm(standardName);
      if (!normalizedStandardName) return true;

      const standardRow = standards.find(
        (s) => norm(s?.Standard_List).toLowerCase() === normalizedStandardName.toLowerCase()
      );
      const marker = String(standardRow?.Negative_Marking ?? standardRow?.NEGATIVE_MARKING ?? '').trim().toLowerCase();
      if (!marker) return true;
      return marker !== 'no' && marker !== 'false' && marker !== '0';
    }, [standards, norm]);

    const calculateResultFormPercentage = useCallback((totalQuestionsValue, correctAnswersValue, standardName) => {
      const totalQuestions = parseInt(totalQuestionsValue, 10);
      const correctAnswers = parseInt(correctAnswersValue, 10);

      if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return '';
      if (!Number.isFinite(correctAnswers) || correctAnswers < 0 || correctAnswers > totalQuestions) return '';

      const wrongAnswers = totalQuestions - correctAnswers;
      const hasNegativeMarking = isNegativeMarkingEnabledForStandard(standardName);
      const rawScore = hasNegativeMarking ? correctAnswers - (wrongAnswers * 0.25) : correctAnswers;
      const finalScore = Math.max(0, rawScore);
      const percentage = (finalScore / totalQuestions) * 100;

      return Number.isFinite(percentage) ? percentage.toFixed(2) : '';
    }, [isNegativeMarkingEnabledForStandard]);

    const resultStandardForPercentage = useMemo(() => {
      if (resultEditMode) {
        return String(resultEditTarget?.STANDARD || resultFormData.standard || '');
      }
      return String(resultFormData.standard || '');
    }, [resultEditMode, resultEditTarget, resultFormData.standard]);

    const resultHasNegativeMarking = useMemo(
      () => isNegativeMarkingEnabledForStandard(resultStandardForPercentage),
      [isNegativeMarkingEnabledForStandard, resultStandardForPercentage]
    );

    useEffect(() => {
      if (isResultPercentageManuallyEdited) return;

      const autoPercentage = calculateResultFormPercentage(
        resultFormData.totalQuestions,
        resultFormData.correctAnswers,
        resultStandardForPercentage
      );

      setResultFormData((prev) => (
        prev.percentage === autoPercentage ? prev : { ...prev, percentage: autoPercentage }
      ));
    }, [
      resultFormData.totalQuestions,
      resultFormData.correctAnswers,
      resultStandardForPercentage,
      isResultPercentageManuallyEdited,
      calculateResultFormPercentage
    ]);

    const RESULT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
    const resultAllowedAttachmentMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const resultAllowedAttachmentExtensions = new Set(['.pdf', '.doc', '.docx']);

    const resetResultAttachment = useCallback(() => {
      setResultAttachmentFile(null);
      if (resultAttachmentInputRef.current) {
        resultAttachmentInputRef.current.value = '';
      }
    }, []);

    const handleResultAttachmentChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        setResultAttachmentFile(null);
        return;
      }

      const ext = `.${String(file.name || '').split('.').pop()}`.toLowerCase();
      const extOk = resultAllowedAttachmentExtensions.has(ext);
      const mimeOk = resultAllowedAttachmentMimeTypes.has(file.type);

      if (!extOk && !mimeOk) {
        showToast('Only PDF, DOC, or DOCX attachments are allowed.', 'error');
        resetResultAttachment();
        return;
      }

      if (file.size > RESULT_ATTACHMENT_MAX_BYTES) {
        showToast('Attachment must be 20MB or smaller.', 'error');
        resetResultAttachment();
        return;
      }

      setResultAttachmentFile(file);
    };

    const uploadResultAttachment = async ({ id, standard, date, file }) => {
      const formDataPayload = new FormData();
      formDataPayload.append('attachment', file);

      const response = await fetch(
        `${API_BASE_URL}/api/results/${encodeURIComponent(id)}/${encodeURIComponent(standard)}/${encodeURIComponent(date)}/attachment`,
        {
          method: 'POST',
          body: formDataPayload
        }
      );

      if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(msg || `HTTP ${response.status}`);
      }

      return response.json();
    };

    const downloadResultAttachment = async (result) => {
      const hasAttachment = String(result?.HAS_PRACTICAL_ATTACHMENT) === '1' || result?.HAS_PRACTICAL_ATTACHMENT === 1;
      if (!hasAttachment) {
        showToast('No attachment found for this result.', 'info');
        return;
      }

      const url = `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/attachment`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download attachment');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeStandard = String(result.STANDARD || 'Result').replace(/[^a-zA-Z0-9_-]+/g, '_');
        const safeName = String(result.NAME || 'Employee').replace(/[^a-zA-Z0-9_-]+/g, '_');
        const fallbackName = `Result_Attachment_${result.ID}_${safeStandard}_${safeName}`;
        const downloadName = result.PRACTICAL_ATTACHMENT_NAME || fallbackName;

        link.href = blobUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading attachment:', error);
        showToast('Failed to download attachment', 'error');
      }
    };

    const removeResultAttachment = async (result) => {
      const hasAttachment = String(result?.HAS_PRACTICAL_ATTACHMENT) === '1' || result?.HAS_PRACTICAL_ATTACHMENT === 1;
      if (!hasAttachment) {
        showToast('No attachment found for this result.', 'info');
        return;
      }

      const confirmRemove = window.confirm('Remove this attachment? This cannot be undone.');
      if (!confirmRemove) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/attachment`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const msg = await response.text().catch(() => '');
          throw new Error(msg || `HTTP ${response.status}`);
        }

        showToast('Attachment removed successfully!', 'success');
        setResultEditTarget((prev) => prev ? { ...prev, HAS_PRACTICAL_ATTACHMENT: 0, PRACTICAL_ATTACHMENT_NAME: null } : prev);
        resetResultAttachment();
        loadResults(true);
      } catch (error) {
        console.error('Error removing attachment:', error);
        showToast('Failed to remove attachment', 'error');
      }
    };

    const resetAddResultForm = useCallback(() => {
      setResultFormData(createDefaultResultFormData());
      setIsResultPercentageManuallyEdited(false);
    }, []);

    const closeAddResultModal = useCallback(() => {
      setShowAddResultModal(false);
      setResultSaving(false);
      setResultEditMode(false);
      setResultEditTarget(null);
      resetAddResultForm();
      resetResultAttachment();
    }, [resetAddResultForm, resetResultAttachment]);

    const openAddResultModal = useCallback(() => {
      setResultEditMode(false);
      setResultEditTarget(null);
      setResultSaving(false);
      resetAddResultForm();
      resetResultAttachment();
      setShowAddResultModal(true);
    }, [resetAddResultForm, resetResultAttachment]);

    const addResultStatusPreview = useMemo(() => {
      if (!resultFormData.percentage) return '';
      const pct = parseFloat(resultFormData.percentage);
      const passCriteria = parseFloat(resultFormData.passingCriteria);
      if (!Number.isFinite(pct) || !Number.isFinite(passCriteria)) return '';
      return pct >= passCriteria ? 'Pass' : 'Fail';
    }, [resultFormData.percentage, resultFormData.passingCriteria]);

    const hasResultAnswerSheet =
      resultEditMode &&
      resultEditTarget &&
      (String(resultEditTarget.HAS_ANSWER_SHEET) === '1' || resultEditTarget.HAS_ANSWER_SHEET === 1);

    const hasResultAttachment =
      resultEditMode &&
      resultEditTarget &&
      (String(resultEditTarget.HAS_PRACTICAL_ATTACHMENT) === '1' || resultEditTarget.HAS_PRACTICAL_ATTACHMENT === 1);

    const resultAttachmentLocked = hasResultAnswerSheet || hasResultAttachment;
    const resultAttachmentLockNote = hasResultAnswerSheet
      ? 'Answer sheet is auto-generated. Attachment upload is disabled.'
      : hasResultAttachment
        ? 'Attachment already exists. Remove it to upload a new file.'
        : '';

    const openEditResultModal = useCallback((result) => {
      const parsedPercentage = parseFloat(String(result?.PERCENTAGE ?? '').replace('%', ''));
      const parsedPassingCriteria = parseFloat(String(result?.PASSING_CRITERIA ?? '').replace('%', ''));
      const totalQuestions = String(result?.TOTAL_QUESTION ?? '100');
      const correctAnswers = String(result?.CORRECT_ANSWER ?? '');
      const { dateInput, timeInput } = parseResultDateTimeInputs(result?.DATE);

      setResultEditTarget(result);
      setResultEditMode(true);
      setResultSaving(false);
      setIsResultPercentageManuallyEdited(false);
      setResultFormData({
        employeeId: String(result?.ID ?? ''),
        employeeName: String(result?.NAME ?? ''),
        standard: String(result?.STANDARD ?? ''),
        totalQuestions,
        correctAnswers,
        percentage: Number.isFinite(parsedPercentage) ? parsedPercentage.toFixed(2) : '',
        passingCriteria: Number.isFinite(parsedPassingCriteria) ? String(parsedPassingCriteria) : '75',
        resultDate: dateInput,
        resultTime: timeInput
      });
      resetResultAttachment();
      setShowAddResultModal(true);
    }, [resetResultAttachment]);

    // Interconnected handlers: ID <-> Name (based on results only)
    const onChangeEmpId = (val) => {
      setFilterEmpId(val);
      if (!val) { setFilterEmpName(''); return; }
      const name = employeeIdToName.get(String(val)) || '';
      setFilterEmpName(name);
    };

    const onChangeEmpName = (val) => {
      setFilterEmpName(val);
      if (!val) { setFilterEmpId(''); return; }
      const id = employeeNameToId.get(val) || '';
      setFilterEmpId(id);
    };

    const clearFilters = () => {
      setFilterEmpId('');
      setFilterEmpName('');
      setFilterStatus('All');
      setFilterStandard('All');
      setFilterDateFrom('');
      setFilterDateTo('');
      setResultsCurrentPage(1);
    };

    const handleAddResultSubmit = async (e) => {
      e.preventDefault();

      const selectedEmployee = employees.find(emp => String(emp.ID) === String(resultFormData.employeeId));
      const fallbackEmployee = resultEditMode && resultEditTarget
        ? { ID: resultEditTarget.ID, Name: resultEditTarget.NAME }
        : null;
      const resolvedEmployee = selectedEmployee || fallbackEmployee;

      if (!resolvedEmployee || !resolvedEmployee.ID) {
        showToast('Please select a valid employee.', 'error');
        return;
      }

      const resolvedStandard = resultEditMode
        ? String(resultEditTarget?.STANDARD || resultFormData.standard || '')
        : resultFormData.standard;

      if (!resolvedStandard) {
        showToast('Please select a standard.', 'error');
        return;
      }

      const totalQuestions = parseInt(resultFormData.totalQuestions, 10);
      const correctAnswers = parseInt(resultFormData.correctAnswers, 10);
      const autoCalculatedPercentage = calculateResultFormPercentage(
        resultFormData.totalQuestions,
        resultFormData.correctAnswers,
        resolvedStandard
      );
      const percentageValue = isResultPercentageManuallyEdited
        ? parseFloat(resultFormData.percentage)
        : parseFloat(autoCalculatedPercentage || resultFormData.percentage);
      const passingCriteria = parseFloat(resultFormData.passingCriteria);

      if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) {
        showToast('Total questions must be greater than 0.', 'error');
        return;
      }

      if (!Number.isFinite(correctAnswers) || correctAnswers < 0 || correctAnswers > totalQuestions) {
        showToast('Correct answers must be between 0 and total questions.', 'error');
        return;
      }

      if (!Number.isFinite(percentageValue) || percentageValue < 0 || percentageValue > 100) {
        showToast('Percentage must be between 0 and 100.', 'error');
        return;
      }

      if (!Number.isFinite(passingCriteria) || passingCriteria < 0 || passingCriteria > 100) {
        showToast('Passing criteria must be between 0 and 100.', 'error');
        return;
      }

      const composedDateTime = composeResultDateTime(resultFormData.resultDate, resultFormData.resultTime);
      if (!composedDateTime) {
        showToast('Please enter a valid result date and time.', 'error');
        return;
      }

      const status = percentageValue >= passingCriteria ? 'Pass' : 'Fail';

      const resultData = {
        ID: String(resolvedEmployee.ID),
        NAME: String(resolvedEmployee.Name || resultFormData.employeeName || ''),
        TOTAL_QUESTION: totalQuestions,
        CORRECT_ANSWER: correctAnswers,
        WRONG_ANSWER: totalQuestions - correctAnswers,
        PERCENTAGE: `${percentageValue.toFixed(2)}%`,
        PASSING_CRITERIA: `${passingCriteria}%`,
        STATUS: status,
        STANDARD: resolvedStandard,
        DATE: composedDateTime,
        answers: {},
        questions: []
      };

      if (resultEditMode && resultEditTarget?.DATE) {
        resultData.ORIGINAL_DATE = String(resultEditTarget.DATE);
      }

      setResultSaving(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultData)
        });

        if (!response.ok) {
          throw new Error(resultEditMode ? 'Failed to update result' : 'Failed to add result');
        }

        if (resultAttachmentFile) {
          try {
            await uploadResultAttachment({
              id: resultData.ID,
              standard: resultData.STANDARD,
              date: resultData.DATE,
              file: resultAttachmentFile
            });
            showToast('Attachment uploaded successfully!', 'success');
          } catch (uploadError) {
            console.error('Attachment upload error:', uploadError);
            showToast('Result saved but attachment upload failed.', 'error');
          }
        }

        showToast(resultEditMode ? 'Result updated successfully!' : 'Result added successfully!', 'success');
        // Await the results refresh BEFORE closing the modal so that
        // re-opening the same record immediately (e.g. to click Download)
        // already sees HAS_PRACTICAL_ATTACHMENT = 1.
        await loadResults(true);
        closeAddResultModal();
      } catch (err) {
        console.error('Error adding result:', err);
        showToast(resultEditMode ? 'Failed to update result' : 'Failed to add result', 'error');
      } finally {
        setResultSaving(false);
      }
    };

    // ✅ Re-added: CSV export helper used by the button below
    const exportCsv = (rows) => {
      const headers = ['S.No.', 'Employee ID', 'Name', 'Standard', 'Total', 'Correct', 'Wrong', 'Score', 'Pass Criteria', 'Status', 'Date'];
      const data = rows.map((r, i) => [
        i + 1,
        norm(r.ID),
        norm(r.NAME),
        norm(r.STANDARD),
        norm(r.TOTAL_QUESTION),
        norm(r.CORRECT_ANSWER),
        norm(r.WRONG_ANSWER),
        `${toPctNumber(r.PERCENTAGE)}%`,
        norm(r.PASSING_CRITERIA),
        norm(r.STATUS),
        norm(r.DATE)
      ]);
      const csv = [headers, ...data].map(row =>
        row.map(cell => {
          const s = cell?.toString() ?? '';
          const needsQuote = /[",\n]/.test(s);
          const esc = s.replace(/"/g, '""');
          return needsQuote ? `"${esc}"` : esc;
        }).join(',')
      ).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ptis-test-results-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Apply filters
    const filteredResults = useMemo(() => {
      return results.filter(r => {
        const matchId = filterEmpId ? String(r.ID) === String(filterEmpId) : true;
        const matchName = filterEmpName ? normLower(r.NAME) === normLower(filterEmpName) : true;
        const matchEmployee = filterEmpId ? matchId : (filterEmpName ? matchName : true);
        const matchStatus = filterStatus === 'All' ? true : normLower(r.STATUS) === normLower(filterStatus);
        const matchStd = filterStandard === 'All' ? true : norm(r.STANDARD) === norm(filterStandard);
        const dateKey = toResultDateKey(r.DATE);
        const matchFrom = filterDateFrom ? (dateKey && dateKey >= filterDateFrom) : true;
        const matchTo = filterDateTo ? (dateKey && dateKey <= filterDateTo) : true;
        return matchEmployee && matchStatus && matchStd && matchFrom && matchTo;
      });
    }, [results, filterEmpId, filterEmpName, filterStatus, filterStandard, filterDateFrom, filterDateTo, norm, normLower, toResultDateKey]);

    const paginatedResults = useMemo(() => {
      const startIndex = (resultsCurrentPage - 1) * resultsItemsPerPage;
      const endIndex = startIndex + resultsItemsPerPage;
      return filteredResults.slice(startIndex, endIndex);
    }, [filteredResults, resultsCurrentPage, resultsItemsPerPage]);

    const totalResultPages = Math.ceil(filteredResults.length / resultsItemsPerPage);

    useEffect(() => {
      setResultsCurrentPage(1);
    }, [filterEmpId, filterEmpName, filterStatus, filterStandard, filterDateFrom, filterDateTo]);

    useEffect(() => {
      if (totalResultPages > 0 && resultsCurrentPage > totalResultPages) {
        setResultsCurrentPage(totalResultPages);
      }
    }, [resultsCurrentPage, totalResultPages]);

    // Certificate filtered results
    const certFilteredResults = useMemo(() => {
      let passed = results.filter(r => isPass(r.STATUS));
      
      if (certFilterId) {
        passed = passed.filter(r => 
          norm(r.ID).toLowerCase().includes(certFilterId.toLowerCase())
        );
      }
      if (certFilterName) {
        passed = passed.filter(r => 
          norm(r.NAME).toLowerCase().includes(certFilterName.toLowerCase())
        );
      }
      
      return passed;
    }, [results, certFilterId, certFilterName]);

    // Stats from filtered results
    const totalTests = filteredResults.length;
    const passedTests = filteredResults.filter(r => isPass(r.STATUS)).length;
    const failedTests = totalTests - passedTests;
    const averageScore = totalTests > 0
      ? filteredResults.reduce((sum, r) => sum + toPctNumber(r.PERCENTAGE), 0) / totalTests
      : 0;

    useEffect(() => {
      if (isAdmin && currentPage === 'admin' && results.length === 0) {
        console.log('Loading results for admin dashboard');
        loadResults(true);
      }
    }, [isAdmin, currentPage]);

    // Scroll detection for header animation with throttling
    useEffect(() => {
      let ticking = false;
      
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
              setShowHeader(false);
            } else if (currentScrollY < lastScrollY || currentScrollY <= 80) {
              setShowHeader(true);
            }
            setLastScrollY(currentScrollY);
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Sidebar menu items
    const sidebarItems = [
      { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: '#1a1a2e' },
      { id: 'results', icon: FileText, label: 'Test Results', color: '#1a1a2e' },
      { id: 'practical', icon: Plus, label: 'Practical Results', color: '#1a1a2e' },
      { id: 'standards', icon: BookOpen, label: 'Standards', color: '#1a1a2e' },
      { id: 'questions', icon: FileText, label: 'Questions', color: '#1a1a2e' },
      { id: 'certificates', icon: FileCheck, label: 'Certificates', color: '#1a1a2e' },
      { id: 'employees', icon: Users, label: 'Employees', color: '#1a1a2e' }
    ];

    // Certificate Management Page Component - Memoized to prevent re-renders on parent state changes
    const CertificatesAdminPage = useMemo(() => {
      return function CertificatesAdminPageInner() {
        const theme = themeRef.current;
        const isDarkMode = isDarkModeRef.current;
        const colors = colorsRef.current;
        const isMobile = isMobileRef.current;
        const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
        const [searchQuery, setSearchQuery] = useState('');
        const [certificateCurrentPage, setCertificateCurrentPage] = useState(1);
        const [certificateGoToPage, setCertificateGoToPage] = useState('');
        const [certTypes, setCertTypes] = useState({}); // key: stable certificate row id, value: 'New' or 'Recertification'
        const [previousCertNumbers, setPreviousCertNumbers] = useState({}); // key: stable certificate row id, value: manual previous certificate no
        const certificateItemsPerPage = 25;

      const filteredResults = useMemo(() => {
        let passed = results.filter(r => isPass(r.STATUS));

        const toSortableTimestamp = (value) => {
          const raw = norm(value);
          if (!raw) return Number.NEGATIVE_INFINITY;

          const dateOnly = raw.split(' ')[0];
          let parsedDate = null;

          if (dateOnly.includes('/')) {
            const parts = dateOnly.split('/');
            if (parts.length === 3) {
              parsedDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          } else if (dateOnly.includes('-')) {
            const parts = dateOnly.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                // YYYY-MM-DD
                parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              } else {
                // DD-MM-YYYY
                parsedDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              }
            }
          }

          if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
            const fallback = new Date(raw);
            return Number.isNaN(fallback.getTime()) ? Number.NEGATIVE_INFINITY : fallback.getTime();
          }

          return parsedDate.getTime();
        };

        const isNewerResult = (candidate, current) =>
          toSortableTimestamp(candidate?.DATE) >= toSortableTimestamp(current?.DATE);
        
        if (searchQuery) {
          if (searchType === 'id') {
            passed = passed.filter(r => 
              norm(r.ID).toLowerCase().includes(searchQuery.toLowerCase())
            );
          } else {
            passed = passed.filter(r => 
              norm(r.NAME).toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
        }
        
        const normalizeCombinedBaseType = (value) => {
          const raw = norm(value);
          if (!raw) return null;
          const lowered = raw.toLowerCase();
          const hasTag = lowered.includes('general') || lowered.includes('specific') || lowered.includes('practical');
          if (!hasTag) return null;
          const base = raw
            .replace(/\(\s*(general|specific|practical)\s*\)/ig, '')
            .replace(/\s+(general|specific|practical)\b/ig, '')
            .trim();
          return base || null;
        };

        // Group General/Specific/Practical tests by employee
        const grouped = {};
        passed.forEach(r => {
          const standard = norm(r.STANDARD);
          const empId = norm(r.ID);
          const standardLower = standard.toLowerCase();
          const baseType = normalizeCombinedBaseType(standard);

          if (baseType) {
            // Determine test type (General, Specific, or Practical)
            let testType;
            if (standardLower.includes('practical')) {
              testType = 'Practical';
            } else if (standardLower.includes('general')) {
              testType = 'General';
            } else if (standardLower.includes('specific')) {
              testType = 'Specific';
            }

            const key = `${empId}_${baseType.toLowerCase()}`;
            
            if (!grouped[key]) {
              grouped[key] = {
                empId,
                empName: norm(r.NAME),
                baseType,
                general: null,
                specific: null,
                practical: null
              };
            }
            
            if (testType === 'General') {
              if (!grouped[key].general || isNewerResult(r, grouped[key].general)) {
                grouped[key].general = r;
              }
            } else if (testType === 'Specific') {
              if (!grouped[key].specific || isNewerResult(r, grouped[key].specific)) {
                grouped[key].specific = r;
              }
            } else if (testType === 'Practical') {
              if (!grouped[key].practical || isNewerResult(r, grouped[key].practical)) {
                grouped[key].practical = r;
              }
            }
          } else {
            // Regular certificate (single test)
            const key = `${empId}_${standard}`;
            if (!grouped[key] || !grouped[key].single || isNewerResult(r, grouped[key].single)) {
              grouped[key] = {
                empId,
                empName: norm(r.NAME),
                baseType: standard,
                single: r
              };
            }
          }
        });
        
        // Convert grouped results to array
        const finalResults = [];
        Object.values(grouped).forEach(group => {
          if (group.single) {
            // Regular single certificate
            finalResults.push(group.single);
          } else if (group.general && group.specific) {
            // PT/MPT with both tests passed - show as single row for combined certificate
            const resultData = {
              ...group.general,
              STANDARD: group.baseType,
              IS_COMBINED: true,
              GENERAL_DATA: group.general,
              SPECIFIC_DATA: group.specific
            };
            
            // Attach practical only when it belongs to current/latest cycle.
            // Practical is usually entered later, so same day or later than theory is accepted.
            const latestTheoryTimestamp = Math.max(
              toSortableTimestamp(group.general?.DATE),
              toSortableTimestamp(group.specific?.DATE)
            );
            const practicalTimestamp = toSortableTimestamp(group.practical?.DATE);

            if (group.practical && practicalTimestamp >= latestTheoryTimestamp) {
              resultData.PRACTICAL_DATA = group.practical;
            }
            
            finalResults.push(resultData);
          }
          // If only one test passed (general or specific), don't show button
        });
        
        return finalResults;
      }, [searchType, searchQuery, isPass, norm]);

      const totalCertificatePages = Math.ceil(filteredResults.length / certificateItemsPerPage);
      const paginatedCertificateResults = filteredResults.slice(
        (certificateCurrentPage - 1) * certificateItemsPerPage,
        certificateCurrentPage * certificateItemsPerPage
      );

      const getCertificateRowKey = (result) =>
        `${norm(result.ID)}|${norm(result.STANDARD)}|${norm(result.DATE)}`;

      useEffect(() => {
        setCertificateCurrentPage(1);
      }, [searchType, searchQuery]);

      useEffect(() => {
        if (totalCertificatePages > 0 && certificateCurrentPage > totalCertificatePages) {
          setCertificateCurrentPage(totalCertificatePages);
        }
      }, [certificateCurrentPage, totalCertificatePages]);

      return (
        <div>
          {/* Search/Filter Card */}
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
            border: `1px solid ${theme.border.default}`,
            marginBottom: '25px'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              padding: '18px 25px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileCheck size={20} color="#fff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2em', fontWeight: '600', textAlign: 'left' }}>Passed Candidates</h3>
                <p style={{ margin: 0, marginTop: '4px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85em', textAlign: 'left' }}>Generate and Download Certificates For Passed Candidates</p>
              </div>
            </div>

            <div style={{ 
              padding: '20px 25px', 
              backgroundColor: colors.cardAltBg,
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
            <div style={{ minWidth: isMobile ? '100%' : '180px' }}>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: '4px',
                  fontSize: '0.95em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: theme.bg.input,
                  color: theme.text.primary,
                  cursor: 'pointer'
                }}
              >
                <option value="id">Employee ID</option>
                <option value="name">Employee Name</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
              <input
                type="text"
                placeholder={`Search by ${searchType === 'id' ? 'Employee ID' : 'Employee Name'}...`}
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  if (searchType === 'id') {
                    // Only allow numbers for Employee ID
                    if (value === '' || /^[0-9]+$/.test(value)) {
                      setSearchQuery(value);
                    }
                  } else {
                    setSearchQuery(value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: '4px',
                  fontSize: '0.95em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: theme.bg.input,
                  color: theme.text.primary
                }}
              />
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setCertificateCurrentPage(1);
              }}
              disabled={!searchQuery}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: colors.inputBg,
                color: colors.textMuted,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '28px',
                cursor: searchQuery ? 'pointer' : 'not-allowed',
                fontSize: '0.95em',
                fontWeight: '500',
                opacity: searchQuery ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (searchQuery) {
                  e.currentTarget.style.borderColor = '#c0392b';
                  e.currentTarget.style.color = '#c0392b';
                  e.currentTarget.style.backgroundColor = colors.cardBg;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = colors.inputBorder;
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.backgroundColor = colors.inputBg;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
              Clear Filter
            </button>
            </div>
          </div>

          {/* Table Card */}
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
            border: `1px solid ${theme.border.default}`
          }}>
            {filteredResults.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
                <p style={{ color: '#7f8c8d', fontSize: '1.1em' }}>
                  {searchQuery ? 'No matching candidates found' : 'No passed candidates available'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.tableHeaderBg }}>
                      <th style={{ padding: '18px 20px', textAlign: 'left', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Employee ID</th>
                      <th style={{ padding: '18px 20px', textAlign: 'left', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Name</th>
                      <th style={{ padding: '18px 20px', textAlign: 'left', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Standard</th>
                      <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Score</th>
                      <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Date</th>
                      <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Cert Type</th>
                      <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCertificateResults.map((result, index) => {
                      const rowKey = getCertificateRowKey(result);
                      const rowRenderKey = `${rowKey}|${index}`;
                      const selectedCertType = certTypes[rowKey] || 'New';
                      const previousCertNo = previousCertNumbers[rowKey] || '';

                      return (
                      <tr 
                        key={rowRenderKey}
                        style={{ 
                          borderBottom: `1px solid ${colors.border}`,
                          backgroundColor: isDarkMode ? colors.tableRowBg : 'transparent'
                        }}
                      >
                        <td style={{ padding: '16px 20px', color: colors.text, fontWeight: '500' }}>{norm(result.ID)}</td>
                        <td style={{ padding: '16px 20px', color: colors.text }}>{norm(result.NAME)}</td>
                        <td style={{ padding: '16px 20px', color: colors.text }}>{norm(result.STANDARD)}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ 
                            backgroundColor: '#e8f5e9', 
                            color: '#27ae60', 
                            padding: '4px 12px', 
                            borderRadius: '8px',
                            fontSize: '0.9em',
                            fontWeight: '600'
                          }}>
                            {toPctNumber(result.PERCENTAGE).toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: colors.textMuted, textAlign: 'center', fontSize: '0.9em' }}>
                          {norm(result.DATE)}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', minWidth: '260px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <select
                              value={selectedCertType}
                              onChange={async (e) => {
                                const nextType = e.target.value;
                                setCertTypes(prev => ({ ...prev, [rowKey]: nextType }));

                                if (nextType !== 'Recertification') {
                                  return;
                                }

                                const existingValue = String(previousCertNumbers[rowKey] || '').trim();
                                if (existingValue) {
                                  return;
                                }

                                try {
                                  const params = new URLSearchParams({
                                    emp_id: norm(result.ID),
                                    standard: norm(result.STANDARD)
                                  });

                                  const response = await fetch(`${API_BASE_URL}/api/certificates/previous-number?${params.toString()}`);
                                  if (!response.ok) {
                                    return;
                                  }

                                  const data = await response.json();
                                  const autoFillValue = String(data.previous_certificate_no || '').trim();
                                  if (!autoFillValue) {
                                    return;
                                  }

                                  // Do not overwrite if user typed while request was in-flight.
                                  setPreviousCertNumbers(prev => {
                                    if (String(prev[rowKey] || '').trim()) {
                                      return prev;
                                    }
                                    return { ...prev, [rowKey]: autoFillValue };
                                  });
                                } catch (autoFillError) {
                                  console.warn('Previous certificate auto-fill failed:', autoFillError);
                                }
                              }}
                              style={{
                                padding: '8px 12px',
                                border: selectedCertType === 'Recertification' ? '2px solid #16213e' : '2px solid #16a085',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                backgroundColor: selectedCertType === 'Recertification' ? '#16213e' : '#16a085',
                                color: 'white',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <option value="New" style={{ backgroundColor: theme.bg.input, color: theme.text.primary }}>New</option>
                              <option value="Recertification" style={{ backgroundColor: theme.bg.input, color: theme.text.primary }}>Re-Certification</option>
                            </select>

                            {selectedCertType === 'Recertification' && (
                              <input
                                type="text"
                                value={previousCertNo}
                                onChange={(e) => setPreviousCertNumbers(prev => ({ ...prev, [rowKey]: e.target.value }))}
                                placeholder="Previous Certificate No."
                                style={{
                                  width: '220px',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  border: `1px solid ${theme.border.default}`,
                                  backgroundColor: theme.bg.input,
                                  color: theme.text.primary,
                                  fontSize: '13px'
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            onClick={async () => {
                              try {
                                const trimmedPreviousCertNo = String(previousCertNo || '').trim();
                                if (selectedCertType === 'Recertification' && !trimmedPreviousCertNo) {
                                  showToast('Please enter Previous Certificate No. for Re-Certification.', 'error');
                                  return;
                                }

                                let certData;
                                
                                // Check if this is a combined PT/MPT certificate
                                if (result.IS_COMBINED && result.GENERAL_DATA && result.SPECIFIC_DATA) {
                                  // Combined certificate with 2 or 3 rows
                                  certData = {
                                    emp_id: norm(result.ID),
                                    emp_name: norm(result.NAME),
                                    test_date: norm(result.DATE),
                                    status: norm(result.STATUS),
                                    standard: norm(result.STANDARD),
                                    is_combined: true,
                                    general_data: {
                                      standard: norm(result.GENERAL_DATA.STANDARD),
                                      percentage: toPctNumber(result.GENERAL_DATA.PERCENTAGE).toFixed(2),
                                      passing_criteria: norm(result.GENERAL_DATA.PASSING_CRITERIA)
                                    },
                                    specific_data: {
                                      standard: norm(result.SPECIFIC_DATA.STANDARD),
                                      percentage: toPctNumber(result.SPECIFIC_DATA.PERCENTAGE).toFixed(2),
                                      passing_criteria: norm(result.SPECIFIC_DATA.PASSING_CRITERIA)
                                    },
                                    certification_type: selectedCertType
                                  };
                                  
                                  // Add practical data if available
                                  if (result.PRACTICAL_DATA) {
                                    certData.practical_data = {
                                      standard: norm(result.PRACTICAL_DATA.STANDARD),
                                      percentage: toPctNumber(result.PRACTICAL_DATA.PERCENTAGE).toFixed(2),
                                      passing_criteria: norm(result.PRACTICAL_DATA.PASSING_CRITERIA)
                                    };
                                  }
                                } else {
                                  // Regular single certificate
                                  certData = {
                                    emp_id: norm(result.ID),
                                    emp_name: norm(result.NAME),
                                    test_date: norm(result.DATE),
                                    status: norm(result.STATUS),
                                    standard: norm(result.STANDARD),
                                    percentage: toPctNumber(result.PERCENTAGE).toFixed(2),
                                    passing_criteria: norm(result.PASSING_CRITERIA),
                                    certification_type: selectedCertType
                                  };
                                }

                                if (selectedCertType === 'Recertification') {
                                  certData.previous_certificate_no = trimmedPreviousCertNo;
                                }

                                // Call backend API to generate certificate
                                const response = await fetch(`${API_BASE_URL}/api/certificates/generate`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify(certData)
                                });

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.detail || 'Failed to generate certificate');
                                }

                                // Get the PDF blob
                                const blob = await response.blob();
                                
                                // Create download link
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${norm(result.STANDARD)}_Certificate_${norm(result.ID)}_${norm(result.NAME)}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                
                                // Cleanup
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                
                                showToast(`Certificate generated successfully for ${norm(result.NAME)}!`, 'success');
                              } catch (error) {
                                console.error('Certificate generation error:', error);
                                showToast(`Failed to generate certificate: ${error.message}`, 'error');
                              }
                            }}
                            style={{
                              padding: '10px 16px',
                              backgroundColor: '#16a085',
                              color: 'white',
                              border: '2px solid #16a085',
                              borderRadius: '28px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              boxShadow: '0 3px 10px rgba(22, 160, 133, 0.3)',
                              transition: 'all 0.2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                              e.currentTarget.style.color = '#16a085';
                              e.currentTarget.style.border = '2px solid #16a085';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 5px 15px rgba(22, 160, 133, 0.4)';
                              e.currentTarget.querySelector('svg').style.color = '#16a085';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.backgroundColor = '#16a085';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.border = '2px solid #16a085';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 3px 10px rgba(22, 160, 133, 0.3)';
                              e.currentTarget.querySelector('svg').style.color = 'white';
                            }}
                            title="Generate Certificate"
                          >
                            <Download size={16} style={{ color: 'inherit' }} />
                            Generate Certificate
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}

            {totalCertificatePages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                padding: '14px 16px',
                backgroundColor: colors.cardBg,
                borderTop: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => setCertificateCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={certificateCurrentPage === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: certificateCurrentPage === 1 ? colors.border : '#1a1a2e',
                    color: certificateCurrentPage === 1 ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: certificateCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  color: colors.text,
                  fontWeight: '600',
                  fontSize: '14px',
                  padding: '0 10px'
                }}>
                  Page {certificateCurrentPage} of {totalCertificatePages} ({filteredResults.length} candidates)
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: colors.textMuted, fontWeight: '600', fontSize: '12px' }}>Go to</span>
                  <input
                    type="number"
                    min="1"
                    max={totalCertificatePages}
                    value={certificateGoToPage}
                    onChange={(e) => setCertificateGoToPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      const nextPage = parseInt(certificateGoToPage, 10);
                      if (!Number.isFinite(nextPage)) return;
                      setCertificateCurrentPage(Math.min(totalCertificatePages, Math.max(1, nextPage)));
                      setCertificateGoToPage('');
                    }}
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      textAlign: 'center',
                      backgroundColor: colors.cardAltBg,
                      color: colors.text
                    }}
                  />
                  <button
                    onClick={() => {
                      const nextPage = parseInt(certificateGoToPage, 10);
                      if (!Number.isFinite(nextPage)) return;
                      setCertificateCurrentPage(Math.min(totalCertificatePages, Math.max(1, nextPage)));
                      setCertificateGoToPage('');
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a2e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    Go
                  </button>
                </div>

                <button
                  onClick={() => setCertificateCurrentPage(prev => Math.min(totalCertificatePages, prev + 1))}
                  disabled={certificateCurrentPage === totalCertificatePages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: certificateCurrentPage === totalCertificatePages ? colors.border : '#1a1a2e',
                    color: certificateCurrentPage === totalCertificatePages ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: certificateCurrentPage === totalCertificatePages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };
    }, [norm, isPass, toPctNumber, results]); // Recreate when results change to avoid stale data

    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg.primary }}>
        {/* Sidebar */}
        <div 
          onMouseEnter={() => {
            if (!isMobile) setSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (!isMobile) setSidebarHovered(false);
          }}
          style={{
          width: isMobile ? '64px' : sidebarHovered ? '260px' : '80px',
          backgroundColor: '#1a1a2e',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          borderTopRightRadius: isMobile ? '0' : '20px',
          borderBottomRightRadius: isMobile ? '0' : '20px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          willChange: 'width',
          zIndex: 1000
        }}>
          {/* Logo/Header */}
          <div style={{
            padding: '25px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div 
              onClick={() => setAdminActiveTab('dashboard')}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '25px',
                padding: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img 
                src={ptisLogo} 
                alt="PTIS Logo" 
                style={{ 
                  width: '35px', 
                  height: '35px',
                  objectFit: 'contain'
                }} 
              />
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '20px 0' }}>
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = adminActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminActiveTab(item.id)}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: 'none',
                    backgroundColor: isActive ? 'rgba(192, 57, 43, 0.2)' : 'transparent',
                    borderLeft: isActive ? '4px solid transparent' : '4px solid transparent',
                    borderImage: isActive ? 'linear-gradient(180deg, #c0392b, #e74c3c) 1' : 'none',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: !isMobile && sidebarHovered ? 'flex-start' : 'center',
                    gap: '12px',
                    fontSize: '0.95em',
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseOut={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={20} />
                  {!isMobile && sidebarHovered && item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
            <button
              onClick={() => {
                setIsAdmin(false);
                setCurrentPage('home');
                localStorage.removeItem('ptis_admin_logged_in');
                localStorage.removeItem('ptis_current_page');
                setAdminActiveTab('dashboard');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#c0392b';
                e.currentTarget.style.border = '2px solid #c0392b';
                e.currentTarget.querySelector('svg').style.color = '#c0392b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.querySelector('svg').style.color = '#fff';
              }}
              style={{
                width: !isMobile && sidebarHovered ? '100%' : '45px',
                height: !isMobile && sidebarHovered ? 'auto' : '45px',
                padding: !isMobile && sidebarHovered ? '12px' : '0',
                background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                color: '#fff',
                border: '2px solid transparent',
                borderRadius: !isMobile && sidebarHovered ? '28px' : '25px',
                cursor: 'pointer',
                fontSize: '0.95em',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease'
              }}
            >
              <Home size={18} style={{ transition: 'color 0.3s ease' }} />
              {!isMobile && sidebarHovered && 'Logout'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ marginLeft: isMobile ? '64px' : '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top Header Bar */}
          <div style={{
            backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff',
            boxShadow: `0 2px 4px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
            padding: isMobile ? '14px 12px' : '20px 30px',
            borderBottom: '3px solid transparent',
            borderImage: 'linear-gradient(90deg, #c0392b, #e74c3c, #c0392b) 1',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '12px' : 0 }}>
              <div>
                <h1 style={{ margin: 0, color: theme.text.primary, fontSize: isMobile ? '1.2em' : '1.8em', fontWeight: 'bold' }}>
                  {adminActiveTab === 'dashboard' && 'Dashboard Overview'}
                  {adminActiveTab === 'results' && 'Test Results Management'}
                  {adminActiveTab === 'standards' && 'Standards Management'}
                  {adminActiveTab === 'questions' && 'Questions Management'}
                  {adminActiveTab === 'certificates' && 'Certificate Management'}
                  {adminActiveTab === 'employees' && 'Employee Management'}
                  {adminActiveTab === 'practical' && 'Practical Test Management'}
                </h1>
                <p style={{ margin: '5px 0 0', color: theme.text.secondary, fontSize: '0.9em' }}>
                  Welcome to PTIS Testing System Admin Panel
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                <button
                  onClick={toggleTheme}
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    borderRadius: '28px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: theme.text.primary,
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  {!isMobile && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                {(adminActiveTab === 'dashboard' || adminActiveTab === 'certificates') ? null : (
                <button
                  onClick={() => {
                    if (adminActiveTab === 'results') {
                      // Trigger add result
                      document.getElementById('result-add-btn')?.click();
                    } else if (adminActiveTab === 'standards') {
                      // Trigger add standard
                      document.getElementById('standards-add-btn')?.click();
                    } else if (adminActiveTab === 'questions') {
                      // Trigger add question
                      document.getElementById('questions-add-btn')?.click();
                    } else if (adminActiveTab === 'practical') {
                      // Trigger add practical result
                      document.getElementById('practical-add-btn')?.click();
                    } else if (adminActiveTab === 'employees') {
                      // Trigger add employee
                      document.getElementById('employees-add-btn')?.click();
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('svg').style.color = '#c0392b';
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#c0392b';
                    e.currentTarget.style.border = '2px solid #c0392b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('svg').style.color = '#fff';
                    e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.border = '2px solid transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  style={{
                    padding: '12px 25px',
                    background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                    color: '#fff',
                    border: '2px solid transparent',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    fontSize: '0.95em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Plus size={18} style={{ transition: 'color 0.3s ease' }} />
                  Add New {adminActiveTab === 'results' ? 'Result' : adminActiveTab === 'standards' ? 'Standard' : adminActiveTab === 'questions' ? 'Question' : adminActiveTab === 'practical' ? 'Practical Result' : 'Employee'}
                </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, padding: isMobile ? '16px 12px' : isTablet ? '24px 16px' : '30px', overflowY: 'auto', backgroundColor: theme.bg.primary, minHeight: '100vh' }}>
            {error && (
              <div style={commonStyles.error}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Dashboard Tab */}
            {adminActiveTab === 'dashboard' && (
              <>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: dashboardFourCol, gap: '20px', marginBottom: '30px' }}>
                  <div style={{
                    ...commonStyles.card,
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(26, 26, 46, 0.3)'
                  }}>
                    <FileText size={48} color="#fff" style={{ marginBottom: '15px', opacity: 0.9 }} />
                    <h3 style={{ fontSize: '1em', fontWeight: '500', marginBottom: '10px', color: 'rgba(255,255,255,0.9)' }}>Total Tests</h3>
                    <p style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#fff', margin: 0 }}>{totalTests}</p>
                  </div>
                  <div style={{
                    ...commonStyles.card,
                    background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
                  }}>
                    <CheckCircle size={48} color="#fff" style={{ marginBottom: '15px', opacity: 0.9 }} />
                    <h3 style={{ fontSize: '1em', fontWeight: '500', marginBottom: '10px', color: 'rgba(255,255,255,0.9)' }}>Passed</h3>
                    <p style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#fff', margin: 0 }}>{passedTests}</p>
                  </div>
                  <div style={{
                    ...commonStyles.card,
                    background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #a93226 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(192, 57, 43, 0.3)'
                  }}>
                    <XCircle size={48} color="#fff" style={{ marginBottom: '15px', opacity: 0.9 }} />
                    <h3 style={{ fontSize: '1em', fontWeight: '500', marginBottom: '10px', color: 'rgba(255,255,255,0.9)' }}>Failed</h3>
                    <p style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#fff', margin: 0 }}>{failedTests}</p>
                  </div>
                  <div style={{
                    ...commonStyles.card,
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
                  }}>
                    <BarChart3 size={48} color="#fff" style={{ marginBottom: '15px', opacity: 0.9 }} />
                    <h3 style={{ fontSize: '1em', fontWeight: '500', marginBottom: '10px', color: 'rgba(255,255,255,0.9)' }}>Avg Score</h3>
                    <p style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#fff', margin: 0 }}>{averageScore.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Charts Section */}
                <div style={{ display: 'grid', gridTemplateColumns: dashboardTwoCol, gap: '20px', marginBottom: '30px' }}>
                  {/* Pass/Fail Pie Chart */
                  <div style={{
                    backgroundColor: theme.bg.card,
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                    border: `1px solid ${theme.border.default}`,
                    padding: '25px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <TrendingUp size={24} color={theme.text.primary} />
                      <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Pass/Fail Distribution</h3>
                    </div>
                    {results.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: theme.text.muted }}>
                        <AlertCircle size={48} color={theme.text.muted} style={{ marginBottom: '10px' }} />
                        <p>No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <defs>
                            <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2ecc71" />
                              <stop offset="100%" stopColor="#27ae60" />
                            </linearGradient>
                            <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e74c3c" />
                              <stop offset="100%" stopColor="#c0392b" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={[
                              { name: 'Passed', value: passedTests, color: 'url(#passGradient)' },
                              { name: 'Failed', value: failedTests, color: 'url(#failGradient)' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              { name: 'Passed', value: passedTests, color: 'url(#passGradient)' },
                              { name: 'Failed', value: failedTests, color: 'url(#failGradient)' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend wrapperStyle={{ color: theme.text.primary }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  /* Standards Performance Bar Chart */}
                  <div style={{
                    backgroundColor: theme.bg.card,
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                    border: `1px solid ${theme.border.default}`,
                    padding: '25px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <Award size={24} color={theme.text.primary} />
                      <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Performance by Standard</h3>
                    </div>
                    {results.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: theme.text.muted }}>
                        <AlertCircle size={48} color={theme.text.muted} style={{ marginBottom: '10px' }} />
                        <p>No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(() => {
                            const standardStats = {};
                            results.forEach(r => {
                              const std = norm(r.STANDARD);
                              if (!standardStats[std]) {
                                standardStats[std] = { standard: std, total: 0, passed: 0, failed: 0, avgScore: 0, sumScore: 0 };
                              }
                              standardStats[std].total++;
                              standardStats[std].sumScore += toPctNumber(r.PERCENTAGE);
                              if (isPass(r.STATUS)) {
                                standardStats[std].passed++;
                              } else {
                                standardStats[std].failed++;
                              }
                            });
                            return Object.values(standardStats).map(s => ({
                              ...s,
                              avgScore: (s.sumScore / s.total).toFixed(1),
                              passRate: ((s.passed / s.total) * 100).toFixed(1)
                            }));
                          })()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="barPassGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2ecc71" />
                              <stop offset="100%" stopColor="#27ae60" />
                            </linearGradient>
                            <linearGradient id="barFailGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e74c3c" />
                              <stop offset="100%" stopColor="#c0392b" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="standard" tick={{ fill: theme.text.primary }} />
                          <YAxis tick={{ fill: theme.text.primary }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend wrapperStyle={{ color: theme.text.primary }} />
                          <Bar dataKey="passed" fill="url(#barPassGradient)" name="Passed" />
                          <Bar dataKey="failed" fill="url(#barFailGradient)" name="Failed" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Score Distribution & Performance Trend */}
                  <div style={{
                    backgroundColor: theme.bg.card,
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                    border: `1px solid ${theme.border.default}`,
                    padding: '25px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <BarChart3 size={24} color={theme.text.primary} />
                      <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Score Distribution</h3>
                    </div>
                    {results.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: theme.text.muted }}>
                        <AlertCircle size={48} color={theme.text.muted} style={{ marginBottom: '10px' }} />
                        <p>No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(() => {
                            const ranges = {
                              '0-40%': 0,
                              '40-60%': 0,
                              '60-80%': 0,
                              '80-100%': 0
                            };
                            results.forEach(r => {
                              const score = toPctNumber(r.PERCENTAGE);
                              if (score < 40) ranges['0-40%']++;
                              else if (score < 60) ranges['40-60%']++;
                              else if (score < 80) ranges['60-80%']++;
                              else ranges['80-100%']++;
                            });
                            return Object.entries(ranges).map(([range, count]) => ({
                              range,
                              count,
                              fill: range === '0-40%' ? '#c0392b' : range === '40-60%' ? '#e67e22' : range === '60-80%' ? '#f39c12' : '#27ae60'
                            }));
                          })()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="range" tick={{ fill: theme.text.primary }} />
                          <YAxis tick={{ fill: theme.text.primary }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend 
                            wrapperStyle={{ color: theme.text.primary }} 
                            formatter={(value) => <span style={{ color: theme.text.primary }}>{value}</span>}
                          />
                          <Bar dataKey="count" name="Tests" fill={isDarkMode ? '#ffffff' : '#1a1a2e'} >
                            {(() => {
                              const ranges = {
                                '0-40%': 0,
                                '40-60%': 0,
                                '60-80%': 0,
                                '80-100%': 0
                              };
                              results.forEach(r => {
                                const score = toPctNumber(r.PERCENTAGE);
                                if (score < 40) ranges['0-40%']++;
                                else if (score < 60) ranges['40-60%']++;
                                else if (score < 80) ranges['60-80%']++;
                                else ranges['80-100%']++;
                              });
                              return Object.entries(ranges).map(([range, count], index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={range === '0-40%' ? '#c0392b' : range === '40-60%' ? '#e67e22' : range === '60-80%' ? '#f39c12' : '#27ae60'}
                                />
                              ));
                            })()}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Performance Trend */}
                  <div style={{
                    backgroundColor: theme.bg.card,
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                    border: `1px solid ${theme.border.default}`,
                    padding: '25px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <TrendingUp size={24} color={theme.text.primary} />
                      <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Performance Trend (Latest 20 Tests)</h3>
                    </div>
                    {results.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: theme.text.muted }}>
                        <AlertCircle size={48} color={theme.text.muted} style={{ marginBottom: '10px' }} />
                        <p>No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={results.slice(-20).map((r, idx) => ({
                            test: `Test ${idx + 1}`,
                            score: toPctNumber(r.PERCENTAGE),
                            name: norm(r.NAME)
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="test" tick={{ fill: theme.text.primary }} />
                          <YAxis domain={[0, 100]} tick={{ fill: theme.text.primary }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend wrapperStyle={{ color: theme.text.primary }} />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke={isDarkMode ? '#ffffff' : '#1a1a2e'} 
                            strokeWidth={2}
                            name="Score (%)"
                            dot={{ fill: isDarkMode ? '#ffffff' : '#1a1a2e', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div style={{
                  backgroundColor: theme.bg.card,
                  borderRadius: '28px',
                  overflow: 'hidden',
                  boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                  border: `1px solid ${theme.border.default}`
                }}>
                  <div style={{ padding: '25px', borderBottom: `2px solid ${theme.border.default}` }}>
                    <h2 style={{ color: theme.text.primary, margin: 0, fontSize: '1.3em', fontWeight: '600' }}>Recent Test Results</h2>
                  </div>
                  {results.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <AlertCircle size={48} color={theme.text.muted} style={{ marginBottom: '15px' }} />
                      <p style={{ color: theme.text.muted, fontSize: '1.1em' }}>No Test Results Available</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: colors.tableHeaderBg, color: 'white' }}>
                            <th style={commonStyles.th}>Employee ID</th>
                            <th style={commonStyles.th}>Name</th>
                            <th style={commonStyles.th}>Standard</th>
                            <th style={commonStyles.th}>Score</th>
                            <th style={commonStyles.th}>Status</th>
                            <th style={commonStyles.th}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.slice(-10).reverse().map((result, index) => (
                            <tr key={index} style={{ 
                              borderBottom: `1px solid ${colors.border}`,
                              backgroundColor: isDarkMode ? colors.tableRowBg : 'transparent'
                            }}>
                              <td style={commonStyles.td}>{norm(result.ID)}</td>
                              <td style={commonStyles.td}>{norm(result.NAME)}</td>
                              <td style={commonStyles.td}>{norm(result.STANDARD)}</td>
                              <td style={commonStyles.td}>{toPctNumber(result.PERCENTAGE).toFixed(2)}%</td>
                              <td style={{
                                ...commonStyles.td,
                                textAlign: 'center'
                              }}>
                                <span style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.85em',
                                  fontWeight: 'bold',
                                  backgroundColor: isPass(result.STATUS) ? '#d4edda' : '#f8d7da',
                                  color: isPass(result.STATUS) ? '#155724' : '#721c24'
                                }}>
                                  {norm(result.STATUS)}
                                </span>
                              </td>
                              <td style={commonStyles.td}>{norm(result.DATE)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Results Tab */}
            {adminActiveTab === 'results' && (
              <>
                {/* Hidden trigger button */}
                <button id="result-add-btn" onClick={openAddResultModal} style={{ display: 'none' }} />

                {/* FILTER BAR */}
                <div style={{ 
                  backgroundColor: theme.bg.card,
                  borderRadius: '28px',
                  marginBottom: 25,
                  boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                  border: `1px solid ${theme.border.default}`,
                  overflow: 'hidden'
                }}>
                  {/* Filter Header */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    padding: '18px 25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '18px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={20} color="#fff" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2em', fontWeight: '600', textAlign: 'left' }}>Filter Test Results</h3>
                      <p style={{ margin: 0, marginTop: '4px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85em', textAlign: 'left' }}>Narrow Down Results By Employee, Status, or Standard</p>
                    </div>
                  </div>
                  
                  {/* Filter Grid */}
                  <div style={{ padding: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 10, 
                          fontWeight: '600', 
                          color: theme.text.primary, 
                          fontSize: '0.9em',
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)'
                          }}></span>
                          Employee ID
                        </label>
                        <select 
                          value={filterEmpId} 
                          onChange={e => onChangeEmpId(e.target.value)} 
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '14px',
                            border: `2px solid ${theme.border.default}`,
                            borderRadius: '4px',
                            backgroundColor: theme.bg.input,
                            color: theme.text.primary,
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = theme.text.primary;
                            e.target.style.backgroundColor = theme.bg.secondary;
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = theme.border.default;
                            e.target.style.backgroundColor = theme.bg.input;
                          }}
                        >
                          <option value="">All Employees</option>
                          {employeeIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 10, 
                          fontWeight: '600', 
                          color: theme.text.primary, 
                          fontSize: '0.9em',
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)'
                          }}></span>
                          Employee Name
                        </label>
                        <select 
                          value={filterEmpName} 
                          onChange={e => onChangeEmpName(e.target.value)} 
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '14px',
                            border: `2px solid ${theme.border.default}`,
                            borderRadius: '4px',
                            backgroundColor: theme.bg.input,
                            color: theme.text.primary,
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = theme.text.primary;
                            e.target.style.backgroundColor = theme.bg.secondary;
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = theme.border.default;
                            e.target.style.backgroundColor = theme.bg.input;
                          }}
                        >
                          <option value="">All Names</option>
                          {employeeNameOptions.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 10, 
                          fontWeight: '600', 
                          color: theme.text.primary, 
                          fontSize: '0.9em',
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)'
                          }}></span>
                          Status
                        </label>
                        <select 
                          value={filterStatus} 
                          onChange={e => setFilterStatus(e.target.value)} 
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '14px',
                            border: `2px solid ${theme.border.default}`,
                            borderRadius: '4px',
                            backgroundColor: theme.bg.input,
                            color: theme.text.primary,
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = theme.text.primary;
                            e.target.style.backgroundColor = theme.bg.secondary;
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = theme.border.default;
                            e.target.style.backgroundColor = theme.bg.input;
                          }}
                        >
                          {['All', 'Pass', 'Fail'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 10, 
                          fontWeight: '600', 
                          color: theme.text.primary, 
                          fontSize: '0.9em',
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)'
                          }}></span>
                          Standard
                        </label>
                        <select 
                          value={filterStandard} 
                          onChange={e => setFilterStandard(e.target.value)} 
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '14px',
                            border: `2px solid ${theme.border.default}`,
                            borderRadius: '4px',
                            backgroundColor: theme.bg.input,
                            color: theme.text.primary,
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = theme.text.primary;
                            e.target.style.backgroundColor = theme.bg.secondary;
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = theme.border.default;
                            e.target.style.backgroundColor = theme.bg.input;
                          }}
                        >
                          {standardOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 10, 
                          fontWeight: '600', 
                          color: theme.text.primary, 
                          fontSize: '0.9em',
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)'
                          }}></span>
                          From Date
                        </label>
                        <input
                          type="date"
                          value={filterDateFrom}
                          onChange={e => setFilterDateFrom(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '14px',
                            border: `2px solid ${theme.border.default}`,
                            borderRadius: '4px',
                            backgroundColor: theme.bg.input,
                            color: theme.text.primary,
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = theme.text.primary;
                            e.target.style.backgroundColor = theme.bg.secondary;
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = theme.border.default;
                            e.target.style.backgroundColor = theme.bg.input;
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 10, 
                          fontWeight: '600', 
                          color: theme.text.primary, 
                          fontSize: '0.9em',
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)'
                          }}></span>
                          To Date
                        </label>
                        <input
                          type="date"
                          value={filterDateTo}
                          onChange={e => setFilterDateTo(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '14px',
                            border: `2px solid ${theme.border.default}`,
                            borderRadius: '4px',
                            backgroundColor: theme.bg.input,
                            color: theme.text.primary,
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = theme.text.primary;
                            e.target.style.backgroundColor = theme.bg.secondary;
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = theme.border.default;
                            e.target.style.backgroundColor = theme.bg.input;
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Filter Actions with Results Count */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 25,
                      paddingTop: 20,
                      borderTop: '1px solid #e9ecef',
                      flexWrap: 'wrap',
                      gap: '15px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: '#e8f5e9',
                          color: '#27ae60',
                          borderRadius: '28px',
                          fontSize: '0.9em',
                          fontWeight: '600'
                        }}>
                          <FileText size={16} />
                          {filteredResults.length} Result{filteredResults.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => exportCsv(filteredResults)}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#16a085',
                            color: 'white',
                            border: '2px solid #16a085',
                            borderRadius: '28px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 3px 10px rgba(22, 160, 133, 0.3)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                            e.currentTarget.style.color = '#16a085';
                            e.currentTarget.style.border = '2px solid #16a085';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 5px 15px rgba(22, 160, 133, 0.4)';
                            e.currentTarget.querySelector('svg').style.color = '#16a085';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = '#16a085';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.border = '2px solid #16a085';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(22, 160, 133, 0.3)';
                            e.currentTarget.querySelector('svg').style.color = 'white';
                          }}
                        >
                          <Download size={16} style={{ color: 'inherit' }} /> Export to CSV
                        </button>
                        <button 
                          onClick={clearFilters}
                          disabled={!filterEmpId && !filterEmpName && filterStatus === 'All' && filterStandard === 'All' && !filterDateFrom && !filterDateTo}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            backgroundColor: colors.inputBg,
                            color: colors.textMuted,
                            border: `2px solid ${colors.inputBorder}`,
                            borderRadius: '28px',
                            cursor: (filterEmpId || filterEmpName || filterStatus !== 'All' || filterStandard !== 'All' || filterDateFrom || filterDateTo) ? 'pointer' : 'not-allowed',
                            fontSize: '0.95em',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            opacity: (filterEmpId || filterEmpName || filterStatus !== 'All' || filterStandard !== 'All' || filterDateFrom || filterDateTo) ? 1 : 0.5
                          }}
                          onMouseOver={e => {
                            if (filterEmpId || filterEmpName || filterStatus !== 'All' || filterStandard !== 'All' || filterDateFrom || filterDateTo) {
                              e.currentTarget.style.borderColor = '#c0392b';
                              e.currentTarget.style.color = '#c0392b';
                              e.currentTarget.style.backgroundColor = colors.cardBg;
                            }
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.borderColor = colors.inputBorder;
                            e.currentTarget.style.color = colors.textMuted;
                            e.currentTarget.style.backgroundColor = colors.inputBg;
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14H6L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4h6v2"></path>
                          </svg>
                          Clear Filter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtered Charts Section */}
                {filteredResults.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: dashboardTwoCol, gap: '20px', marginBottom: '30px' }}>
                    {/* Pass/Fail Pie Chart */}
                    <div style={{
                      backgroundColor: theme.bg.card,
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                      border: `1px solid ${theme.border.default}`,
                      padding: '25px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <TrendingUp size={24} color={theme.text.primary} />
                        <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Pass/Fail Distribution</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <defs>
                            <linearGradient id="resultsPassGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2ecc71" />
                              <stop offset="100%" stopColor="#27ae60" />
                            </linearGradient>
                            <linearGradient id="resultsFailGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e74c3c" />
                              <stop offset="100%" stopColor="#c0392b" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={[
                              { name: 'Passed', value: passedTests, color: 'url(#resultsPassGradient)' },
                              { name: 'Failed', value: failedTests, color: 'url(#resultsFailGradient)' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              { name: 'Passed', value: passedTests, color: 'url(#resultsPassGradient)' },
                              { name: 'Failed', value: failedTests, color: 'url(#resultsFailGradient)' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend wrapperStyle={{ color: theme.text.primary }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Standards Performance Bar Chart */
                    <div style={{
                      backgroundColor: theme.bg.card,
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                      border: `1px solid ${theme.border.default}`,
                      padding: '25px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Award size={24} color={theme.text.primary} />
                        <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Performance by Standard</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(() => {
                            const standardStats = {};
                            filteredResults.forEach(r => {
                              const std = norm(r.STANDARD);
                              if (!standardStats[std]) {
                                standardStats[std] = { standard: std, passed: 0, failed: 0, total: 0, sumScore: 0 };
                              }
                              standardStats[std].total++;
                              standardStats[std].sumScore += toPctNumber(r.PERCENTAGE);
                              if (isPass(r.STATUS)) standardStats[std].passed++;
                              else standardStats[std].failed++;
                            });
                            return Object.values(standardStats).map(s => ({
                              ...s,
                              avgScore: (s.sumScore / s.total).toFixed(1),
                              passRate: ((s.passed / s.total) * 100).toFixed(1)
                            }));
                          })()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="resultsBarPassGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2ecc71" />
                              <stop offset="100%" stopColor="#27ae60" />
                            </linearGradient>
                            <linearGradient id="resultsBarFailGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e74c3c" />
                              <stop offset="100%" stopColor="#c0392b" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="standard" tick={{ fill: theme.text.primary }} />
                          <YAxis tick={{ fill: theme.text.primary }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend wrapperStyle={{ color: theme.text.primary }} />
                          <Bar dataKey="passed" fill="url(#resultsBarPassGradient)" name="Passed" />
                          <Bar dataKey="failed" fill="url(#resultsBarFailGradient)" name="Failed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    /* Score Distribution */}
                    <div style={{
                      backgroundColor: theme.bg.card,
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                      border: `1px solid ${theme.border.default}`,
                      padding: '25px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <BarChart3 size={24} color={theme.text.primary} />
                        <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Score Distribution</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(() => {
                            const ranges = {
                              '0-40%': 0,
                              '40-60%': 0,
                              '60-80%': 0,
                              '80-100%': 0
                            };
                            filteredResults.forEach(r => {
                              const score = toPctNumber(r.PERCENTAGE);
                              if (score < 40) ranges['0-40%']++;
                              else if (score < 60) ranges['40-60%']++;
                              else if (score < 80) ranges['60-80%']++;
                              else ranges['80-100%']++;
                            });
                            return Object.entries(ranges).map(([range, count]) => ({
                              range,
                              count,
                              fill: range === '0-40%' ? '#c0392b' : range === '40-60%' ? '#e67e22' : range === '60-80%' ? '#f39c12' : '#27ae60'
                            }));
                          })()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="range" tick={{ fill: theme.text.primary }} />
                          <YAxis tick={{ fill: theme.text.primary }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend 
                            wrapperStyle={{ color: theme.text.primary }} 
                            formatter={(value) => <span style={{ color: theme.text.primary }}>{value}</span>}
                          />
                          <Bar dataKey="count" name="Tests" fill={isDarkMode ? '#ffffff' : '#1a1a2e'} >
                            {(() => {
                              const ranges = {
                                '0-40%': 0,
                                '40-60%': 0,
                                '60-80%': 0,
                                '80-100%': 0
                              };
                              filteredResults.forEach(r => {
                                const score = toPctNumber(r.PERCENTAGE);
                                if (score < 40) ranges['0-40%']++;
                                else if (score < 60) ranges['40-60%']++;
                                else if (score < 80) ranges['60-80%']++;
                                else ranges['80-100%']++;
                              });
                              return Object.entries(ranges).map(([range, count], index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={range === '0-40%' ? '#c0392b' : range === '40-60%' ? '#e67e22' : range === '60-80%' ? '#f39c12' : '#27ae60'}
                                />
                              ));
                            })()}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Performance Trend */}
                    <div style={{
                      backgroundColor: theme.bg.card,
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                      border: `1px solid ${theme.border.default}`,
                      padding: '25px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <TrendingUp size={24} color={theme.text.primary} />
                        <h3 style={{ margin: 0, color: theme.text.primary, fontSize: '1.2em', fontWeight: '600' }}>Performance Trend</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={filteredResults.slice(0, 20).map((r, idx) => ({
                            test: `Test ${idx + 1}`,
                            score: toPctNumber(r.PERCENTAGE),
                            name: norm(r.NAME)
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="test" tick={{ fill: theme.text.primary }} />
                          <YAxis domain={[0, 100]} tick={{ fill: theme.text.primary }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }}
                            itemStyle={{ color: theme.text.primary }}
                            labelStyle={{ color: theme.text.primary }}
                          />
                          <Legend wrapperStyle={{ color: theme.text.primary }} />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke={isDarkMode ? '#ffffff' : '#1a1a2e'} 
                            strokeWidth={2}
                            name="Score (%)"
                            dot={{ fill: isDarkMode ? '#ffffff' : '#1a1a2e', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Results Table */}
                <div style={{
                  backgroundColor: theme.bg.card,
                  borderRadius: '28px',
                  overflow: 'hidden',
                  boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                  border: `1px solid ${theme.border.default}`
                }}>
                  <div style={{ 
                    padding: '25px', 
                    borderBottom: '3px solid #c0392b', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: 'white'
                  }}>
                    <div>
                      <h2 style={{ fontSize: '1.4em', fontWeight: '600', color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Test Results</h2>
                      <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '8px', fontSize: '0.95em', margin: 0 }}>
                        Showing {filteredResults.length} record{filteredResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {adminLoading ? (
                      <div style={commonStyles.loading}>
                        <Loader size={24} /> Loading results...
                      </div>
                    ) : filteredResults.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center' }}>
                        <AlertCircle size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
                        <p style={{ color: '#7f8c8d', fontSize: '1.1em', margin: 0 }}>No test results match your filters.</p>
                      </div>
                    ) : (
                      <table style={commonStyles.table}>
                        <thead>
                          <tr style={{ backgroundColor: colors.tableHeaderBg, color: 'white' }}>
                            <th style={commonStyles.th}>S.No.</th>
                            <th style={commonStyles.th}>Employee ID</th>
                            <th style={commonStyles.th}>Name</th>
                            <th style={commonStyles.th}>Standard</th>
                            <th style={commonStyles.th}>Total</th>
                            <th style={commonStyles.th}>Correct</th>
                            <th style={commonStyles.th}>Wrong</th>
                            <th style={commonStyles.th}>Score</th>
                            <th style={commonStyles.th}>Pass Criteria</th>
                            <th style={commonStyles.th}>Status</th>
                            <th style={commonStyles.th}>Date</th>
                            <th style={commonStyles.th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedResults.map((result, index) => {
                            const hasAnswerSheet = String(result.HAS_ANSWER_SHEET) === '1' || result.HAS_ANSWER_SHEET === 1;

                            const handleDeleteResult = async () => {
                              if (!window.confirm(`Are you sure you want to delete this test result for ${result.NAME}?`)) return;
                              try {
                                const response = await fetch(
                                  `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}`,
                                  { method: 'DELETE' }
                                );
                                if (!response.ok) throw new Error('Delete failed');
                                showToast('Result deleted successfully!', 'success');
                                loadResults(true);
                              } catch (error) {
                                console.error('Error deleting result:', error);
                                showToast('Failed to delete result', 'error');
                              }
                            };

                            const handleDownloadPDF = async () => {
                              if (!hasAnswerSheet) {
                                showToast('Detailed answer sheet is not available for this result.', 'info');
                                return;
                              }

                              const url = `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/pdf`;
                              try {
                                const response = await fetch(url);
                                if (!response.ok) throw new Error('Failed to download test sheet');

                                const pdfBlob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(pdfBlob);
                                const link = document.createElement('a');
                                const safeStandard = String(result.STANDARD || 'Test').replace(/[^a-zA-Z0-9_-]+/g, '_');
                                const safeName = String(result.NAME || 'Employee').replace(/[^a-zA-Z0-9_-]+/g, '_');

                                link.href = blobUrl;
                                link.download = `Test_Sheet_${result.ID}_${safeStandard}_${safeName}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (error) {
                                console.error('Error downloading test sheet PDF:', error);
                                showToast('Failed to download test sheet PDF', 'error');
                              }
                            };

                            const handleEditResult = () => {
                              openEditResultModal(result);
                            };

                            const isPracticalResult = String(result.STANDARD || '').includes('(Practical)');
                            const hasAttachment =
                              String(result.HAS_PRACTICAL_ATTACHMENT) === '1' || result.HAS_PRACTICAL_ATTACHMENT === 1;

                            const handleDownloadAttachment = async () => {
                              if (!hasAttachment) {
                                showToast('No attachment found for this result.', 'info');
                                return;
                              }

                              const url = `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/attachment`;
                              try {
                                const response = await fetch(url);
                                if (!response.ok) throw new Error('Failed to download attachment');

                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                const safeStandard = String(result.STANDARD || 'Practical').replace(/[^a-zA-Z0-9_-]+/g, '_');
                                const safeName = String(result.NAME || 'Employee').replace(/[^a-zA-Z0-9_-]+/g, '_');
                                const prefix = isPracticalResult ? 'Practical_Attachment' : 'Result_Attachment';
                                const fallbackName = `${prefix}_${result.ID}_${safeStandard}_${safeName}`;
                                const downloadName = result.PRACTICAL_ATTACHMENT_NAME || fallbackName;

                                link.href = blobUrl;
                                link.download = downloadName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (error) {
                                console.error('Error downloading attachment:', error);
                                showToast('Failed to download attachment', 'error');
                              }
                            };

                            const downloadEnabled = hasAttachment || hasAnswerSheet;
                            const handleDownload = hasAttachment ? handleDownloadAttachment : handleDownloadPDF;
                            const downloadTitle = hasAttachment
                              ? (isPracticalResult ? 'Download Practical Attachment' : 'Download Attachment')
                              : (hasAnswerSheet ? 'Download Test Sheet PDF' : 'No attachment or answer sheet available');

                            return (
                              <tr key={`${result.ID}-${result.STANDARD}-${result.DATE}-${index}`} style={{ 
                                borderBottom: `1px solid ${colors.border}`,
                                backgroundColor: isDarkMode ? colors.tableRowBg : 'transparent'
                              }}>
                                <td style={commonStyles.td}>{((resultsCurrentPage - 1) * resultsItemsPerPage + index + 1)}</td>
                                <td style={commonStyles.td}>{norm(result.ID)}</td>
                                <td style={commonStyles.td}>{norm(result.NAME)}</td>
                                <td style={commonStyles.td}>{norm(result.STANDARD)}</td>
                                <td style={commonStyles.td}>{norm(result.TOTAL_QUESTION)}</td>
                                <td style={commonStyles.td}>{norm(result.CORRECT_ANSWER)}</td>
                                <td style={commonStyles.td}>{norm(result.WRONG_ANSWER)}</td>
                                <td style={commonStyles.td}>{toPctNumber(result.PERCENTAGE).toFixed(2)}%</td>
                                <td style={commonStyles.td}>{norm(result.PASSING_CRITERIA)}</td>
                                <td style={{
                                  ...commonStyles.td,
                                  textAlign: 'center'
                                }}>
                                  <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.85em',
                                    fontWeight: 'bold',
                                    backgroundColor: isPass(result.STATUS) ? '#d4edda' : '#f8d7da',
                                    color: isPass(result.STATUS) ? '#155724' : '#721c24'
                                  }}>
                                    {norm(result.STATUS)}
                                  </span>
                                </td>
                                <td style={commonStyles.td}>{norm(result.DATE)}</td>
                                <td style={commonStyles.td}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                                    <button
                                      onClick={handleDownload}
                                      disabled={!downloadEnabled}
                                      style={{
                                        padding: '8px',
                                        width: '36px',
                                        height: '36px',
                                        boxSizing: 'border-box',
                                        backgroundColor: downloadEnabled ? '#1a1a2e' : '#95a5a6',
                                        color: 'white',
                                        border: downloadEnabled ? '2px solid #1a1a2e' : '2px solid #95a5a6',
                                        borderRadius: '28px',
                                        cursor: downloadEnabled ? 'pointer' : 'not-allowed',
                                        opacity: downloadEnabled ? 1 : 0.65,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                      }}
                                      title={downloadTitle}
                                      onMouseOver={e => {
                                        if (!downloadEnabled) return;
                                        e.currentTarget.style.backgroundColor = '#e1e2e2ff';
                                        e.currentTarget.style.color = '#1a1a2e';
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.backgroundColor = downloadEnabled ? '#1a1a2e' : '#95a5a6';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button
                                      onClick={handleEditResult}
                                      style={{
                                        padding: '8px',
                                        width: '36px',
                                        height: '36px',
                                        boxSizing: 'border-box',
                                        background: 'linear-gradient(120deg, #1a1a2e, #16213e)',
                                        color: 'white',
                                        border: '2px solid transparent',
                                        borderRadius: '28px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                      }}
                                      title="Edit Test Result"
                                      onMouseOver={e => {
                                        e.currentTarget.style.background = '#e1e2e2ff';
                                        e.currentTarget.style.border = '2px solid #1a1a2e';
                                        e.currentTarget.style.color = '#1a1a2e';
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.background = 'linear-gradient(120deg, #1a1a2e, #16213e)';
                                        e.currentTarget.style.border = '2px solid transparent';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={handleDeleteResult}
                                      style={{
                                        padding: '8px',
                                        width: '36px',
                                        height: '36px',
                                        boxSizing: 'border-box',
                                        background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                                        color: 'white',
                                        border: '2px solid transparent',
                                        borderRadius: '28px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                      }}
                                      title="Delete Test Result"
                                      onMouseOver={e => {
                                        e.currentTarget.style.background = '#e1e2e2ff';
                                        e.currentTarget.style.border = '2px solid #c0392b';
                                        e.currentTarget.style.color = '#c0392b';
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                                        e.currentTarget.style.border = '2px solid transparent';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalResultPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                      padding: '14px 16px',
                      backgroundColor: colors.cardBg,
                      borderTop: `1px solid ${colors.border}`
                    }}>
                      <button
                        onClick={() => setResultsCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={resultsCurrentPage === 1}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: resultsCurrentPage === 1 ? colors.border : '#1a1a2e',
                          color: resultsCurrentPage === 1 ? colors.textMuted : 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: resultsCurrentPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Previous
                      </button>

                      <span style={{
                        color: colors.text,
                        fontWeight: '600',
                        fontSize: '14px',
                        padding: '0 10px'
                      }}>
                        Page {resultsCurrentPage} of {totalResultPages} ({filteredResults.length} results)
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: colors.textMuted, fontWeight: '600', fontSize: '12px' }}>Go to</span>
                        <input
                          type="number"
                          min="1"
                          max={totalResultPages}
                          value={resultsGoToPage}
                          onChange={(e) => setResultsGoToPage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            const nextPage = parseInt(resultsGoToPage, 10);
                            if (!Number.isFinite(nextPage)) return;
                            setResultsCurrentPage(Math.min(totalResultPages, Math.max(1, nextPage)));
                            setResultsGoToPage('');
                          }}
                          style={{
                            width: '70px',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            fontSize: '14px',
                            textAlign: 'center',
                            backgroundColor: colors.cardAltBg,
                            color: colors.text
                          }}
                        />
                        <button
                          onClick={() => {
                            const nextPage = parseInt(resultsGoToPage, 10);
                            if (!Number.isFinite(nextPage)) return;
                            setResultsCurrentPage(Math.min(totalResultPages, Math.max(1, nextPage)));
                            setResultsGoToPage('');
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1a1a2e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px'
                          }}
                        >
                          Go
                        </button>
                      </div>

                      <button
                        onClick={() => setResultsCurrentPage(prev => Math.min(totalResultPages, prev + 1))}
                        disabled={resultsCurrentPage === totalResultPages}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: resultsCurrentPage === totalResultPages ? colors.border : '#1a1a2e',
                          color: resultsCurrentPage === totalResultPages ? colors.textMuted : 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: resultsCurrentPage === totalResultPages ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Result Modal */}
                {showAddResultModal && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(26, 26, 46, 0.85)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    marginLeft: 0
                  }}>
                    <div style={{
                      backgroundColor: theme.bg.card,
                      padding: isMobile ? '22px 16px' : '35px',
                      borderRadius: '28px',
                      width: '100%',
                      maxWidth: isMobile ? '100%' : '650px',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: `0 20px 60px ${isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0, 0, 0, 0.3)'}`,
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      <h3 style={{
                        marginTop: 0,
                        marginBottom: '25px',
                        color: theme.text.primary,
                        fontSize: '1.6em',
                        fontWeight: '600',
                        borderBottom: '3px solid #c0392b',
                        paddingBottom: '15px'
                      }}>
                        {resultEditMode ? 'Edit Result' : 'Add Result'}
                      </h3>

                      <form onSubmit={handleAddResultSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Employee ID:
                            </label>
                            <select
                              value={resultFormData.employeeId}
                              disabled={resultEditMode}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedEmployee = employees.find(emp => String(emp.ID) === String(selectedId));
                                setResultFormData({
                                  ...resultFormData,
                                  employeeId: selectedId,
                                  employeeName: selectedEmployee ? String(selectedEmployee.Name || '') : ''
                                });
                              }}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: resultEditMode ? colors.cardAltBg : colors.inputBg,
                                color: colors.text,
                                cursor: resultEditMode ? 'not-allowed' : 'pointer'
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                            >
                              <option value="">Select ID</option>
                              {resultEmployeeIdOptions.map(empId => (
                                <option key={empId} value={empId}>
                                  {empId}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Employee Name:
                            </label>
                            <select
                              value={resultFormData.employeeName}
                              disabled={resultEditMode}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                const selectedEmployee = employees.find(emp => String(emp.Name || '') === selectedName);
                                setResultFormData({
                                  ...resultFormData,
                                  employeeName: selectedName,
                                  employeeId: selectedEmployee ? String(selectedEmployee.ID || '') : ''
                                });
                              }}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: resultEditMode ? colors.cardAltBg : colors.inputBg,
                                color: colors.text,
                                cursor: resultEditMode ? 'not-allowed' : 'pointer'
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                            >
                              <option value="">Select Name</option>
                              {resultEmployeeNameOptions.map(empName => (
                                <option key={empName} value={empName}>
                                  {empName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div style={{ marginBottom: '22px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: colors.text,
                            fontSize: '0.95em'
                          }}>
                            Standard:
                          </label>
                          <select
                            value={resultFormData.standard}
                            disabled={resultEditMode}
                            onChange={(e) => {
                              setIsResultPercentageManuallyEdited(false);
                              setResultFormData({ ...resultFormData, standard: e.target.value });
                            }}
                            required
                            style={{
                              width: '100%',
                              padding: '12px 15px',
                              border: `2px solid ${colors.inputBorder}`,
                              borderRadius: '4px',
                              fontSize: '15px',
                              transition: 'border-color 0.2s ease',
                              outline: 'none',
                              boxSizing: 'border-box',
                              backgroundColor: resultEditMode ? colors.cardAltBg : colors.inputBg,
                              color: colors.text,
                              cursor: resultEditMode ? 'not-allowed' : 'pointer'
                            }}
                            onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                            onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                          >
                            <option value="">Select Standard</option>
                            {resultStandardOptions.map(stdName => (
                              <option key={stdName} value={stdName}>
                                {stdName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Result Date:
                            </label>
                            <input
                              type="date"
                              value={resultFormData.resultDate}
                              onChange={(e) => setResultFormData({ ...resultFormData, resultDate: e.target.value })}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: colors.inputBg,
                                color: colors.text
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Result Time:
                            </label>
                            <input
                              type="time"
                              value={resultFormData.resultTime}
                              onChange={(e) => setResultFormData({ ...resultFormData, resultTime: e.target.value })}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: colors.inputBg,
                                color: colors.text
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Total Questions:
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={resultFormData.totalQuestions}
                              onChange={(e) => {
                                setIsResultPercentageManuallyEdited(false);
                                setResultFormData({ ...resultFormData, totalQuestions: e.target.value });
                              }}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: colors.inputBg,
                                color: colors.text
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                              placeholder="100"
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Correct Answers:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={resultFormData.correctAnswers}
                              onChange={(e) => {
                                setIsResultPercentageManuallyEdited(false);
                                setResultFormData({ ...resultFormData, correctAnswers: e.target.value });
                              }}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: colors.inputBg,
                                color: colors.text
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                              placeholder="85"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Percentage (%):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={resultFormData.percentage}
                              onChange={(e) => {
                                setIsResultPercentageManuallyEdited(true);
                                setResultFormData({ ...resultFormData, percentage: e.target.value });
                              }}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                backgroundColor: colors.inputBg,
                                color: colors.text,
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                              placeholder="Auto calculated (editable)"
                            />
                            <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textMuted }}>
                              {resultHasNegativeMarking
                                ? 'Auto formula: (Correct - Wrong x 0.25) / Total x 100'
                                : 'Auto formula: Correct / Total x 100'}
                            </div>
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontWeight: '600',
                              color: colors.text,
                              fontSize: '0.95em'
                            }}>
                              Passing Criteria (%):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={resultFormData.passingCriteria}
                              onChange={(e) => setResultFormData({ ...resultFormData, passingCriteria: e.target.value })}
                              required
                              style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: `2px solid ${colors.inputBorder}`,
                                borderRadius: '4px',
                                fontSize: '15px',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                boxSizing: 'border-box',
                                backgroundColor: colors.inputBg,
                                color: colors.text
                              }}
                              onFocus={e => (e.target.style.borderColor = '#1a1a2e')}
                              onBlur={e => (e.target.style.borderColor = colors.inputBorder)}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: colors.text,
                            fontSize: '0.95em'
                          }}>
                            Result Status:
                          </label>
                          <div style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: `2px solid ${colors.inputBorder}`,
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            backgroundColor: colors.cardAltBg,
                            color: addResultStatusPreview === 'Pass' ? '#27ae60' : addResultStatusPreview === 'Fail' ? '#c0392b' : colors.textMuted,
                            fontWeight: '600'
                          }}>
                            {addResultStatusPreview || 'Calculated from percentage and passing criteria'}
                          </div>
                        </div>

                        <div style={{ marginBottom: '22px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: colors.text,
                            fontSize: '0.95em'
                          }}>
                            Attachment (PDF, DOC, DOCX):
                          </label>
                          {resultAttachmentLockNote && (
                            <div style={{
                              marginBottom: '10px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              backgroundColor: colors.cardAltBg,
                              border: `1px solid ${colors.inputBorder}`,
                              color: colors.textMuted,
                              fontSize: '12px'
                            }}>
                              {resultAttachmentLockNote}
                            </div>
                          )}
                          {resultEditMode && resultEditTarget && (String(resultEditTarget.HAS_PRACTICAL_ATTACHMENT) === '1' || resultEditTarget.HAS_PRACTICAL_ATTACHMENT === 1) && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: colors.cardAltBg,
                              border: `1px solid ${colors.inputBorder}`,
                              marginBottom: '10px'
                            }}>
                              <span style={{ color: colors.text, fontSize: '0.9em' }}>
                                Current: {resultEditTarget.PRACTICAL_ATTACHMENT_NAME || 'Attachment'}
                              </span>
                              <button
                                type="button"
                                onClick={() => downloadResultAttachment(resultEditTarget)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#1a1a2e',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '20px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => removeResultAttachment(resultEditTarget)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#c0392b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '20px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!resultAttachmentLocked) {
                                  resultAttachmentInputRef.current?.click();
                                }
                              }}
                              disabled={resultAttachmentLocked}
                              onMouseEnter={(e) => {
                                if (resultAttachmentLocked) return;
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.color = '#c0392b';
                                e.currentTarget.style.border = '2px solid #c0392b';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                if (resultAttachmentLocked) return;
                                e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.border = '2px solid transparent';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              style={{
                                padding: '10px 16px',
                                background: resultAttachmentLocked ? '#95a5a6' : 'linear-gradient(120deg, #c0392b, #e74c3c)',
                                color: '#fff',
                                border: '2px solid transparent',
                                borderRadius: '8px',
                                cursor: resultAttachmentLocked ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                opacity: resultAttachmentLocked ? 0.75 : 1
                              }}
                            >
                              Choose File
                            </button>
                            <span style={{ fontSize: '12px', color: colors.textMuted }}>
                              {resultAttachmentFile ? resultAttachmentFile.name : 'No file chosen'}
                            </span>
                          </div>
                          <input
                            ref={resultAttachmentInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleResultAttachmentChange}
                            disabled={resultAttachmentLocked}
                            style={{ display: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px', paddingTop: '25px', borderTop: '2px solid #ecf0f1' }}>
                          <button
                            type="button"
                            onClick={closeAddResultModal}
                            style={{
                              padding: '12px 30px',
                              backgroundColor: theme.bg.card,
                              color: theme.text.secondary,
                              border: `2px solid ${theme.border.default}`,
                              borderRadius: '28px',
                              cursor: 'pointer',
                              fontSize: '15px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#c0392b';
                              e.currentTarget.style.color = '#c0392b';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = theme.border.default;
                              e.currentTarget.style.color = theme.text.secondary;
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={resultSaving}
                            style={{
                              padding: '12px 30px',
                              background: resultSaving ? '#95a5a6' : 'linear-gradient(120deg, #c0392b, #e74c3c)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '18px',
                              cursor: resultSaving ? 'not-allowed' : 'pointer',
                              fontSize: '15px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              if (!resultSaving) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {resultSaving ? (resultEditMode ? 'Updating...' : 'Adding...') : (resultEditMode ? 'Update Result' : 'Add Result')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Removed certification type edit modal - now handled at certificate generation time */}
              </>
            )}

            {/* Standards Tab */}
            {adminActiveTab === 'standards' && (
              <StandardsAdminPage onBack={() => setAdminActiveTab('dashboard')} showToast={showToast} />
            )}

            {/* Questions Tab */}
            {adminActiveTab === 'questions' && (
              <QuestionsAdminPage onBack={() => setAdminActiveTab('dashboard')} showToast={showToast} />
            )}

            {/* Practical Results Tab */}
            {adminActiveTab === 'practical' && (
              <PracticalResultsPage />
            )}

            {/* Certificates Tab */}
            {adminActiveTab === 'certificates' && (
              <CertificatesAdminPage />
            )}

            {/* Employees Tab */}
            {adminActiveTab === 'employees' && (
              <EmployeesAdminPage onBack={() => setAdminActiveTab('dashboard')} />
            )}
          </div>
        </div>
      </div>
    );
  }; }, []);

  // Practical Results Management Page
  const PracticalResultsPage = useMemo(() => { return function PracticalResultsPageInner() {
    // Shadow outer-scope variables with fresh values from refs.
    const results = resultsRef.current;
    const employees = employeesRef.current;
    const standards = standardsRef.current;
    const theme = themeRef.current;
    const isDarkMode = isDarkModeRef.current;
    const isMobile = isMobileRef.current;
    const colors = colorsRef.current;
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentResult, setCurrentResult] = useState(null);
    const [isPracticalPercentageManuallyEdited, setIsPracticalPercentageManuallyEdited] = useState(false);
    const [formData, setFormData] = useState({
      employeeId: '',
      employeeName: '',
      standard: '',
      standardFullName: '',
      totalQuestions: '100',
      correctAnswers: '',
      percentage: '',
      passingCriteria: '75'
    });
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
    const [searchQuery, setSearchQuery] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const attachmentInputRef = useRef(null);

    const calculatePracticalPercentage = useCallback((totalQuestionsValue, correctAnswersValue) => {
      const totalQuestions = parseInt(totalQuestionsValue, 10);
      const correctAnswers = parseInt(correctAnswersValue, 10);

      if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return '';
      if (!Number.isFinite(correctAnswers) || correctAnswers < 0 || correctAnswers > totalQuestions) return '';

      const percentage = (correctAnswers / totalQuestions) * 100;
      return Number.isFinite(percentage) ? percentage.toFixed(2) : '';
    }, []);

    useEffect(() => {
      if (isPracticalPercentageManuallyEdited) return;

      const autoPercentage = calculatePracticalPercentage(formData.totalQuestions, formData.correctAnswers);
      setFormData((prev) => (
        prev.percentage === autoPercentage ? prev : { ...prev, percentage: autoPercentage }
      ));
    }, [
      formData.totalQuestions,
      formData.correctAnswers,
      isPracticalPercentageManuallyEdited,
      calculatePracticalPercentage
    ]);

    const PRACTICAL_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
    const allowedAttachmentMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const allowedAttachmentExtensions = new Set(['.pdf', '.doc', '.docx']);

    const resetAttachment = () => {
      setAttachmentFile(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
    };

    const handleAttachmentChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        setAttachmentFile(null);
        return;
      }

      const ext = `.${String(file.name || '').split('.').pop()}`.toLowerCase();
      const extOk = allowedAttachmentExtensions.has(ext);
      const mimeOk = allowedAttachmentMimeTypes.has(file.type);

      if (!extOk && !mimeOk) {
        showToast('Only PDF, DOC, or DOCX attachments are allowed.', 'error');
        resetAttachment();
        return;
      }

      if (file.size > PRACTICAL_ATTACHMENT_MAX_BYTES) {
        showToast('Attachment must be 20MB or smaller.', 'error');
        resetAttachment();
        return;
      }

      setAttachmentFile(file);
    };

    const uploadPracticalAttachment = async ({ id, standard, date, file }) => {
      const formDataPayload = new FormData();
      formDataPayload.append('attachment', file);

      const response = await fetch(
        `${API_BASE_URL}/api/results/${encodeURIComponent(id)}/${encodeURIComponent(standard)}/${encodeURIComponent(date)}/attachment`,
        {
          method: 'POST',
          body: formDataPayload
        }
      );

      if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(msg || `HTTP ${response.status}`);
      }

      return response.json();
    };

    const downloadPracticalAttachment = async (result) => {
      const hasAttachment = String(result?.HAS_PRACTICAL_ATTACHMENT) === '1' || result?.HAS_PRACTICAL_ATTACHMENT === 1;
      if (!hasAttachment) {
        showToast('No attachment found for this result.', 'info');
        return;
      }

      const url = `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/attachment`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download attachment');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeStandard = String(result.STANDARD || 'Practical').replace(/[^a-zA-Z0-9_-]+/g, '_');
        const safeName = String(result.NAME || 'Employee').replace(/[^a-zA-Z0-9_-]+/g, '_');
        const fallbackName = `Practical_Attachment_${result.ID}_${safeStandard}_${safeName}`;
        const downloadName = result.PRACTICAL_ATTACHMENT_NAME || fallbackName;

        link.href = blobUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading attachment:', error);
        showToast('Failed to download attachment', 'error');
      }
    };

    const removePracticalAttachment = async (result) => {
      const hasAttachment = String(result?.HAS_PRACTICAL_ATTACHMENT) === '1' || result?.HAS_PRACTICAL_ATTACHMENT === 1;
      if (!hasAttachment) {
        showToast('No attachment found for this result.', 'info');
        return;
      }

      const confirmRemove = window.confirm('Remove this attachment? This cannot be undone.');
      if (!confirmRemove) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/attachment`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const msg = await response.text().catch(() => '');
          throw new Error(msg || `HTTP ${response.status}`);
        }

        showToast('Attachment removed successfully!', 'success');
        setCurrentResult((prev) => prev ? { ...prev, HAS_PRACTICAL_ATTACHMENT: 0, PRACTICAL_ATTACHMENT_NAME: null } : prev);
        resetAttachment();
        loadResults(true);
      } catch (error) {
        console.error('Error removing attachment:', error);
        showToast('Failed to remove attachment', 'error');
      }
    };

    const normalizePracticalBaseType = useCallback((value) => {
      const cleaned = String(value || '')
        .replace(/\(\s*(general|specific|practical)\s*\)/gi, '')
        .replace(/\s+(general|specific|practical)\b/gi, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleaned) return null;
      return { display: cleaned, key: cleaned.toLowerCase() };
    }, []);

    const practicalStandards = useMemo(() => {
      const generalizedNames = new Set();
      standards.forEach((s) => {
        const stdName = String(s?.Standard_List || '').trim();
        if (!stdName) return;
        const stdLower = stdName.toLowerCase();
        if (stdLower.includes('general') || stdLower.includes('specific')) {
          const baseType = normalizePracticalBaseType(stdName);
          if (baseType) {
            generalizedNames.add(`${baseType.display} (Practical)`);
          }
        }
      });
      return Array.from(generalizedNames).sort((a, b) => a.localeCompare(b));
    }, [standards, normalizePracticalBaseType]);

    const practicalResults = useMemo(() => {
      const allPracticalResults = results.filter(
        (r) => r.STANDARD && r.STANDARD.includes('(Practical)')
      );

      if (!searchQuery) return allPracticalResults;

      const query = searchQuery.toLowerCase();
      if (searchType === 'id') {
        return allPracticalResults.filter((result) =>
          String(result.ID || '').toLowerCase().includes(query)
        );
      }

      return allPracticalResults.filter((result) =>
        String(result.NAME || '').toLowerCase().includes(query)
      );
    }, [results, searchQuery, searchType]);

    const eligibleEmployees = useMemo(() => {
      const grouped = {};
      const passed = results.filter(
        (r) => String(r.STATUS || '').trim().toUpperCase() === 'PASS'
      );

      passed.forEach((r) => {
        const standard = String(r.STANDARD || '').trim();
        const standardLower = standard.toLowerCase();
        const empId = String(r.ID || '');

        if (!empId || standardLower.includes('practical')) return;

        const hasGeneral = standardLower.includes('general');
        const hasSpecific = standardLower.includes('specific');

        if (!hasGeneral && !hasSpecific) {
          return;
        }

        const baseType = normalizePracticalBaseType(standard);
        if (!baseType) return;

        const key = `${empId}_${baseType.key}`;

        if (!grouped[key]) {
          grouped[key] = {
            empId,
            empName: r.NAME,
            baseType: baseType.display,
            general: false,
            specific: false,
            practical: false,
          };
        }

        if (hasGeneral) grouped[key].general = true;
        if (hasSpecific) grouped[key].specific = true;
      });

      passed.forEach((r) => {
        const standard = String(r.STANDARD || '').trim();
        const standardLower = standard.toLowerCase();
        if (!standardLower.includes('practical')) return;

        const baseType = normalizePracticalBaseType(standard);
        const empId = String(r.ID || '');

        if (!baseType) return;

        const key = `${empId}_${baseType.key}`;
        if (grouped[key]) grouped[key].practical = true;
      });

      return Object.values(grouped)
        .filter((g) => g.general && g.specific)
        .sort((a, b) => {
          const aNum = Number(a.empId);
          const bNum = Number(b.empId);
          const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum);
          if (bothNumeric && aNum !== bNum) return aNum - bNum;
          if (a.empId !== b.empId) return a.empId.localeCompare(b.empId);
          return a.baseType.localeCompare(b.baseType);
        });
    }, [results, normalizePracticalBaseType]);

    const eligibleEmployeeIds = useMemo(
      () => [...new Set(eligibleEmployees.map((emp) => emp.empId))],
      [eligibleEmployees]
    );

    const eligibleEmployeeNames = useMemo(
      () => [...new Set(eligibleEmployees.map((emp) => emp.empName))],
      [eligibleEmployees]
    );

    const [eligibleCurrentPage, setEligibleCurrentPage] = useState(1);
    const [eligibleGoToPage, setEligibleGoToPage] = useState('');
    const [practicalCurrentPage, setPracticalCurrentPage] = useState(1);
    const [practicalGoToPage, setPracticalGoToPage] = useState('');
    const eligibleItemsPerPage = 50;
    const practicalItemsPerPage = 50;

    const totalEligiblePages = Math.ceil(eligibleEmployees.length / eligibleItemsPerPage);
    const totalPracticalPages = Math.ceil(practicalResults.length / practicalItemsPerPage);

    const paginatedEligibleEmployees = useMemo(() => {
      const startIndex = (eligibleCurrentPage - 1) * eligibleItemsPerPage;
      return eligibleEmployees.slice(startIndex, startIndex + eligibleItemsPerPage);
    }, [eligibleEmployees, eligibleCurrentPage, eligibleItemsPerPage]);

    const paginatedPracticalResults = useMemo(() => {
      const startIndex = (practicalCurrentPage - 1) * practicalItemsPerPage;
      return practicalResults.slice(startIndex, startIndex + practicalItemsPerPage);
    }, [practicalResults, practicalCurrentPage, practicalItemsPerPage]);

    useEffect(() => {
      setPracticalCurrentPage(1);
    }, [searchQuery, searchType]);

    useEffect(() => {
      setEligibleCurrentPage(1);
    }, [eligibleEmployees.length]);

    useEffect(() => {
      if (totalPracticalPages > 0 && practicalCurrentPage > totalPracticalPages) {
        setPracticalCurrentPage(totalPracticalPages);
      }
    }, [practicalCurrentPage, totalPracticalPages]);

    useEffect(() => {
      if (totalEligiblePages > 0 && eligibleCurrentPage > totalEligiblePages) {
        setEligibleCurrentPage(totalEligiblePages);
      }
    }, [eligibleCurrentPage, totalEligiblePages]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      const employee = employees.find(emp => String(emp.ID) === String(formData.employeeId));
      if (!employee) {
        showToast('Employee not found', 'error');
        setLoading(false);
        return;
      }

      // Use abbreviation directly - formData.standard already contains the abbreviation (MPT, PT, UT, VT)
      const totalQ = parseInt(formData.totalQuestions, 10);
      const correctA = parseInt(formData.correctAnswers, 10);
      const percentageValue = parseFloat(formData.percentage);
      const passingCriteriaValue = parseFloat(formData.passingCriteria);

      if (!Number.isFinite(totalQ) || totalQ <= 0) {
        showToast('Total questions must be greater than 0.', 'error');
        setLoading(false);
        return;
      }

      if (!Number.isFinite(correctA) || correctA < 0 || correctA > totalQ) {
        showToast('Correct answers must be between 0 and total questions.', 'error');
        setLoading(false);
        return;
      }

      if (!Number.isFinite(percentageValue) || percentageValue < 0 || percentageValue > 100) {
        showToast('Percentage must be between 0 and 100.', 'error');
        setLoading(false);
        return;
      }

      if (!Number.isFinite(passingCriteriaValue) || passingCriteriaValue < 0 || passingCriteriaValue > 100) {
        showToast('Passing criteria must be between 0 and 100.', 'error');
        setLoading(false);
        return;
      }

      const resultData = {
        ID: formData.employeeId,
        NAME: employee.Name,
        TOTAL_QUESTION: totalQ,
        CORRECT_ANSWER: correctA,
        WRONG_ANSWER: totalQ - correctA,
        PERCENTAGE: `${percentageValue.toFixed(2)}%`,
        PASSING_CRITERIA: `${passingCriteriaValue}%`,
        STATUS: percentageValue >= passingCriteriaValue ? 'Pass' : 'Fail',
        STANDARD: formData.standard, // Already contains "(Practical)" from dropdown
        DATE: editMode ? currentResult.DATE : getPakistanDateTime(),
        answers: {},
        questions: []
      };

      try {
        // Always use POST endpoint - it handles both insert and update
        const response = await fetch(`${API_BASE_URL}/api/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultData)
        });

        if (response.ok) {
          if (attachmentFile) {
            try {
              await uploadPracticalAttachment({
                id: resultData.ID,
                standard: resultData.STANDARD,
                date: resultData.DATE,
                file: attachmentFile
              });
              showToast('Attachment uploaded successfully!', 'success');
            } catch (uploadError) {
              console.error('Attachment upload error:', uploadError);
              showToast('Result saved but attachment upload failed.', 'error');
            }
          }
          showToast(editMode ? 'Practical result updated successfully!' : 'Practical result added successfully!', 'success');
          await loadResults(true);
          setShowModal(false);
          setEditMode(false);
          setCurrentResult(null);
          setIsPracticalPercentageManuallyEdited(false);
          setFormData({ employeeId: '', employeeName: '', standard: '', standardFullName: '', totalQuestions: '100', correctAnswers: '', percentage: '', passingCriteria: '75' });
          resetAttachment();
        } else {
          showToast(editMode ? 'Failed to update practical result' : 'Failed to add practical result', 'error');
        }
      } catch (error) {
        console.error('Error saving practical result:', error);
        showToast('Error saving practical result', 'error');
      }

      setLoading(false);
    };

    const handleEdit = (result) => {
      const standardText = String(result.STANDARD || '');
      const standardBase = standardText.replace(' (Practical)', '');

      setCurrentResult(result);
      setEditMode(true);
      setIsPracticalPercentageManuallyEdited(false);
      setFormData({
        employeeId: result.ID,
        employeeName: result.NAME,
        standard: standardText,
        standardFullName: standardBase,
        totalQuestions: String(result.TOTAL_QUESTION || 100),
        correctAnswers: String(result.CORRECT_ANSWER || 0),
        percentage: result.PERCENTAGE ? result.PERCENTAGE.replace('%', '') : '',
        passingCriteria: result.PASSING_CRITERIA ? result.PASSING_CRITERIA.replace('%', '') : '75'
      });
      resetAttachment();
      setShowModal(true);
    };

    const handleDelete = async (result) => {
      if (!window.confirm(`Are you sure you want to delete practical result for ${result.NAME}?`)) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/results/${result.ID}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          showToast('Practical result deleted successfully!', 'success');
          loadResults(true);
        } else {
          showToast('Failed to delete practical result', 'error');
        }
      } catch (error) {
        console.error('Error deleting practical result:', error);
        showToast('Error deleting practical result', 'error');
      }
    };

    return (
      <div style={{ padding: isMobile ? '16px 12px' : '30px' }}>
        {/* Header Section with Filters */}
        <div style={{
          backgroundColor: theme.bg.card,
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
          border: `1px solid ${theme.border.default}`,
          marginBottom: '25px'
        }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '18px 25px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileCheck size={20} color="#fff" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2em', fontWeight: '600', textAlign: 'left' }}>Practical Test Management</h3>
              <p style={{ margin: 0, marginTop: '4px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85em', textAlign: 'left' }}>Add and Manage Practical Test Results</p>
            </div>
          </div>

          {/* Search Filters */}
          <div style={{ 
            padding: '20px 25px', 
            backgroundColor: colors.cardAltBg,
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ minWidth: isMobile ? '100%' : '180px' }}>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: `2px solid ${colors.inputBorder}`,
                  borderRadius: '4px',
                    fontSize: '0.95em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                <option value="id">Employee ID</option>
                <option value="name">Employee Name</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
              <input
                type="text"
                placeholder={`Search by ${searchType === 'id' ? 'Employee ID' : 'Employee Name'}...`}
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  if (searchType === 'id') {
                    if (value === '' || /^[0-9]+$/.test(value)) {
                      setSearchQuery(value);
                    }
                  } else {
                    setSearchQuery(value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: `2px solid ${colors.inputBorder}`,
                  borderRadius: '4px',
                    fontSize: '0.95em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: colors.inputBg,
                  color: colors.text
                }}
              />
            </div>
            <button
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: colors.inputBg,
                color: colors.textMuted,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '28px',
                cursor: searchQuery ? 'pointer' : 'not-allowed',
                fontSize: '0.95em',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: searchQuery ? 1 : 0.5
              }}
              onMouseOver={(e) => {
                if (searchQuery) {
                  e.currentTarget.style.borderColor = '#c0392b';
                  e.currentTarget.style.color = '#c0392b';
                  e.currentTarget.style.backgroundColor = colors.cardBg;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = colors.inputBorder;
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.backgroundColor = colors.inputBg;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
              Clear Filter
            </button>
          </div>
        </div>

        {/* Hidden trigger button */}
        <button id="practical-add-btn" onClick={() => setShowModal(true)} style={{ display: 'none' }} />

        {/* Eligible Employees Section */}
        {eligibleEmployees.length > 0 && (
          <div style={{
            backgroundColor: colors.cardBg,
            borderRadius: '28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '25px'
          }}>
            <div style={{
              background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
              color: '#fff',
              padding: '16px 20px',
              fontWeight: '600',
              fontSize: '1.1em'
            }}>
              Employees Eligible For Practical Test
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.cardAltBg }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: '600', color: colors.text }}>Employee ID</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: '600', color: colors.text }}>Name</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: '600', color: colors.text }}>Standard</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '600', color: colors.text }}>Tests Passed</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '600', color: colors.text }}>Practical Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEligibleEmployees.map((emp, index) => (
                  <tr key={index} style={{
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: index % 2 === 0 ? colors.cardBg : colors.cardAltBg
                  }}>
                    <td style={{ padding: '14px 20px', color: colors.text }}>{emp.empId}</td>
                    <td style={{ padding: '14px 20px', color: colors.text }}>{emp.empName}</td>
                    <td style={{ padding: '14px 20px', color: colors.text, fontWeight: '500' }}>{emp.baseType}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '28px',
                        fontSize: '0.85em',
                        fontWeight: '600',
                        backgroundColor: '#d4edda',
                        color: '#155724'
                      }}>
                        General + Specific
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      {emp.practical ? (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '28px',
                          fontSize: '0.85em',
                          fontWeight: '600',
                          backgroundColor: '#d4edda',
                          color: '#155724'
                        }}>
                          ✓ Added
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '28px',
                          fontSize: '0.85em',
                          fontWeight: '600',
                          backgroundColor: '#fff3cd',
                          color: '#856404'
                        }}>
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {totalEligiblePages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                padding: '14px 16px',
                backgroundColor: colors.cardBg,
                borderTop: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => setEligibleCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={eligibleCurrentPage === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: eligibleCurrentPage === 1 ? colors.border : '#1a1a2e',
                    color: eligibleCurrentPage === 1 ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: eligibleCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  color: colors.text,
                  fontWeight: '600',
                  fontSize: '14px',
                  padding: '0 10px'
                }}>
                  Page {eligibleCurrentPage} of {totalEligiblePages} ({eligibleEmployees.length} employees)
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: colors.textMuted, fontWeight: '600', fontSize: '12px' }}>Go to</span>
                  <input
                    type="number"
                    min="1"
                    max={totalEligiblePages}
                    value={eligibleGoToPage}
                    onChange={(e) => setEligibleGoToPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      const nextPage = parseInt(eligibleGoToPage, 10);
                      if (!Number.isFinite(nextPage)) return;
                      setEligibleCurrentPage(Math.min(totalEligiblePages, Math.max(1, nextPage)));
                      setEligibleGoToPage('');
                    }}
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      textAlign: 'center',
                      backgroundColor: colors.cardAltBg,
                      color: colors.text
                    }}
                  />
                  <button
                    onClick={() => {
                      const nextPage = parseInt(eligibleGoToPage, 10);
                      if (!Number.isFinite(nextPage)) return;
                      setEligibleCurrentPage(Math.min(totalEligiblePages, Math.max(1, nextPage)));
                      setEligibleGoToPage('');
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a2e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    Go
                  </button>
                </div>

                <button
                  onClick={() => setEligibleCurrentPage(prev => Math.min(totalEligiblePages, prev + 1))}
                  disabled={eligibleCurrentPage === totalEligiblePages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: eligibleCurrentPage === totalEligiblePages ? colors.border : '#1a1a2e',
                    color: eligibleCurrentPage === totalEligiblePages ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: eligibleCurrentPage === totalEligiblePages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Practical Results Table */}
        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.border.default}`,
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.tableHeaderBg, color: '#fff' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Employee ID</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Standard</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>Percentage</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPracticalResults.map((result, index) => {
                const hasAttachment = String(result.HAS_PRACTICAL_ATTACHMENT) === '1' || result.HAS_PRACTICAL_ATTACHMENT === 1;

                return (
                  <tr key={index} style={{
                    borderBottom: `1px solid ${colors.border}`,
                    transition: 'background-color 0.2s',
                    backgroundColor: isDarkMode ? colors.tableRowBg : 'transparent'
                  }}>
                    <td style={{ padding: '16px 20px', color: colors.text }}>{result.ID}</td>
                    <td style={{ padding: '16px 20px', color: colors.text }}>{result.NAME}</td>
                    <td style={{ padding: '16px 20px', color: colors.text }}>{result.STANDARD}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 'bold', color: colors.text }}>
                      {result.PERCENTAGE}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        backgroundColor: result.STATUS && result.STATUS.toUpperCase() === 'PASS' ? '#d4edda' : '#f8d7da',
                        color: result.STATUS && result.STATUS.toUpperCase() === 'PASS' ? '#155724' : '#721c24'
                      }}>
                        {result.STATUS}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.9em', color: colors.textMuted }}>
                      {result.DATE}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => downloadPracticalAttachment(result)}
                          disabled={!hasAttachment}
                          style={{
                            padding: '8px',
                            backgroundColor: hasAttachment ? '#1a1a2e' : '#95a5a6',
                            color: 'white',
                            border: hasAttachment ? '2px solid #1a1a2e' : '2px solid #95a5a6',
                            borderRadius: '28px',
                            cursor: hasAttachment ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          title={hasAttachment ? 'Download Attachment' : 'No attachment available'}
                          onMouseOver={(e) => {
                            if (!hasAttachment) return;
                            e.currentTarget.style.backgroundColor = '#e1e2e2ff';
                            e.currentTarget.style.color = '#1a1a2e';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = hasAttachment ? '#1a1a2e' : '#95a5a6';
                            e.currentTarget.style.color = 'white';
                          }}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(result)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#1a1a2e',
                            color: 'white',
                            border: '2px solid #1a1a2e',
                            borderRadius: '28px',
                            cursor: 'pointer',
                            marginRight: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          title="Edit Practical Result"
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#e1e2e2ff';
                            e.currentTarget.style.color = '#1a1a2e';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a1a2e';
                            e.currentTarget.style.color = 'white';
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(result)}
                          style={{
                            padding: '8px',
                            background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                            color: 'white',
                            border: '2px solid transparent',
                            borderRadius: '28px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          title="Delete Practical Result"
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#e1e2e2ff';
                            e.currentTarget.style.border = '2px solid #c0392b';
                            e.currentTarget.style.color = '#c0392b';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                            e.currentTarget.style.border = '2px solid transparent';
                            e.currentTarget.style.color = 'white';
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {practicalResults.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>
                    No practical results found. Click "Add Practical Result" to add one.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>

          {totalPracticalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              padding: '14px 16px',
              backgroundColor: colors.cardBg,
              borderTop: `1px solid ${colors.border}`
            }}>
              <button
                onClick={() => setPracticalCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={practicalCurrentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: practicalCurrentPage === 1 ? colors.border : '#1a1a2e',
                  color: practicalCurrentPage === 1 ? colors.textMuted : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: practicalCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                Previous
              </button>

              <span style={{
                color: colors.text,
                fontWeight: '600',
                fontSize: '14px',
                padding: '0 10px'
              }}>
                Page {practicalCurrentPage} of {totalPracticalPages} ({practicalResults.length} results)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: colors.textMuted, fontWeight: '600', fontSize: '12px' }}>Go to</span>
                <input
                  type="number"
                  min="1"
                  max={totalPracticalPages}
                  value={practicalGoToPage}
                  onChange={(e) => setPracticalGoToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    const nextPage = parseInt(practicalGoToPage, 10);
                    if (!Number.isFinite(nextPage)) return;
                    setPracticalCurrentPage(Math.min(totalPracticalPages, Math.max(1, nextPage)));
                    setPracticalGoToPage('');
                  }}
                  style={{
                    width: '70px',
                    padding: '6px 10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: colors.cardAltBg,
                    color: colors.text
                  }}
                />
                <button
                  onClick={() => {
                    const nextPage = parseInt(practicalGoToPage, 10);
                    if (!Number.isFinite(nextPage)) return;
                    setPracticalCurrentPage(Math.min(totalPracticalPages, Math.max(1, nextPage)));
                    setPracticalGoToPage('');
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  Go
                </button>
              </div>

              <button
                onClick={() => setPracticalCurrentPage(prev => Math.min(totalPracticalPages, prev + 1))}
                disabled={practicalCurrentPage === totalPracticalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: practicalCurrentPage === totalPracticalPages ? colors.border : '#1a1a2e',
                  color: practicalCurrentPage === totalPracticalPages ? colors.textMuted : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: practicalCurrentPage === totalPracticalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Add Practical Result Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(26, 26, 46, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            marginLeft: 0
          }}>
            <div style={{
              backgroundColor: theme.bg.card,
              padding: isMobile ? '22px 16px' : '35px',
              borderRadius: '28px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: `0 20px 60px ${isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0, 0, 0, 0.3)'}`,
              animation: 'fadeIn 0.2s ease'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: '25px',
                color: theme.text.primary,
                fontSize: '1.6em',
                fontWeight: '600',
                borderBottom: '3px solid #c0392b',
                paddingBottom: '15px'
              }}>
                {editMode ? 'Edit Practical Result' : 'Add Practical Result'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Employee ID:
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedEmp = eligibleEmployees.find(emp => String(emp.empId) === String(selectedId));
                        setFormData({ 
                          ...formData, 
                          employeeId: selectedId,
                          employeeName: selectedEmp ? selectedEmp.empName : ''
                        });
                      }}
                      required
                      disabled={editMode}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: editMode ? colors.cardAltBg : colors.inputBg,
                        color: colors.text,
                        cursor: editMode ? 'not-allowed' : 'pointer',
                        opacity: editMode ? 0.7 : 1
                      }}
                      onFocus={e => !editMode && (e.target.style.borderColor = '#1a1a2e')}
                      onBlur={e => !editMode && (e.target.style.borderColor = colors.inputBorder)}
                    >
                      <option value="">Select ID</option>
                      {eligibleEmployeeIds.map(empId => (
                        <option key={empId} value={empId}>
                          {empId}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Employee Name:
                    </label>
                    <select
                      value={formData.employeeName || ''}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const selectedEmp = eligibleEmployees.find(emp => emp.empName === selectedName);
                        setFormData({ 
                          ...formData, 
                          employeeName: selectedName,
                          employeeId: selectedEmp ? selectedEmp.empId : ''
                        });
                      }}
                      required
                      disabled={editMode}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: editMode ? colors.cardAltBg : colors.inputBg,
                        color: colors.text,
                        cursor: editMode ? 'not-allowed' : 'pointer',
                        opacity: editMode ? 0.7 : 1
                      }}
                      onFocus={e => !editMode && (e.target.style.borderColor = '#1a1a2e')}
                      onBlur={e => !editMode && (e.target.style.borderColor = colors.inputBorder)}
                    >
                      <option value="">Select Name</option>
                      {eligibleEmployeeNames.map(empName => (
                        <option key={empName} value={empName}>
                          {empName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: colors.text,
                    fontSize: '0.95em'
                  }}>
                    Standard:
                  </label>
                  <select
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                    required
                    disabled={editMode}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: `2px solid ${colors.inputBorder}`,
                      borderRadius: '4px',
                        fontSize: '15px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: editMode ? colors.cardAltBg : colors.inputBg,
                      color: colors.text,
                      cursor: editMode ? 'not-allowed' : 'pointer',
                      opacity: editMode ? 0.7 : 1
                    }}
                    onFocus={e => !editMode && (e.target.style.borderColor = '#1a1a2e')}
                    onBlur={e => !editMode && (e.target.style.borderColor = colors.inputBorder)}
                  >
                    <option value="">Select Standard</option>
                    {practicalStandards.map(stdName => (
                      <option key={stdName} value={stdName}>
                        {stdName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Total Questions:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalQuestions}
                      onChange={(e) => {
                        setIsPracticalPercentageManuallyEdited(false);
                        setFormData({ ...formData, totalQuestions: e.target.value });
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: colors.inputBg,
                        color: colors.text
                      }}
                      onFocus={e => e.target.style.borderColor = '#1a1a2e'}
                      onBlur={e => e.target.style.borderColor = colors.inputBorder}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Correct Answers:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.correctAnswers}
                      onChange={(e) => {
                        setIsPracticalPercentageManuallyEdited(false);
                        setFormData({ ...formData, correctAnswers: e.target.value });
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: colors.inputBg,
                        color: colors.text
                      }}
                      onFocus={e => e.target.style.borderColor = '#1a1a2e'}
                      onBlur={e => e.target.style.borderColor = colors.inputBorder}
                      placeholder="85"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '22px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Percentage (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.percentage}
                      onChange={(e) => {
                        setIsPracticalPercentageManuallyEdited(true);
                        setFormData({ ...formData, percentage: e.target.value });
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#1a1a2e'}
                      onBlur={e => e.target.style.borderColor = colors.inputBorder}
                      placeholder="Auto calculated (editable)"
                    />
                    <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textMuted }}>
                      Auto formula: Correct / Total x 100
                    </div>
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Passing Criteria (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingCriteria}
                      onChange={(e) => setFormData({ ...formData, passingCriteria: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: colors.inputBg,
                        color: colors.text
                      }}
                      onFocus={e => e.target.style.borderColor = '#1a1a2e'}
                      onBlur={e => e.target.style.borderColor = colors.inputBorder}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: colors.text,
                    fontSize: '0.95em'
                  }}>
                    Attachment (PDF, DOC, DOCX):
                  </label>
                  {editMode && currentResult && (String(currentResult.HAS_PRACTICAL_ATTACHMENT) === '1' || currentResult.HAS_PRACTICAL_ATTACHMENT === 1) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: colors.cardAltBg,
                      border: `1px solid ${colors.inputBorder}`,
                      marginBottom: '10px'
                    }}>
                      <span style={{ color: colors.text, fontSize: '0.9em' }}>
                        Current: {currentResult.PRACTICAL_ATTACHMENT_NAME || 'Attachment'}
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadPracticalAttachment(currentResult)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1a1a2e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => removePracticalAttachment(currentResult)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#c0392b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#c0392b';
                        e.currentTarget.style.border = '2px solid #c0392b';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.border = '2px solid transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                        color: '#fff',
                        border: '2px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Choose File
                    </button>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>
                      {attachmentFile ? attachmentFile.name : 'No file chosen'}
                    </span>
                  </div>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleAttachmentChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px', paddingTop: '25px', borderTop: '2px solid #ecf0f1' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditMode(false);
                      setCurrentResult(null);
                      setIsPracticalPercentageManuallyEdited(false);
                      setFormData({ employeeId: '', employeeName: '', standard: '', standardFullName: '', totalQuestions: '100', correctAnswers: '', percentage: '', passingCriteria: '75' });
                      resetAttachment();
                    }}
                    style={{
                      padding: '12px 30px',
                      backgroundColor: theme.bg.card,
                      color: theme.text.secondary,
                      border: `2px solid ${theme.border.default}`,
                      borderRadius: '28px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#c0392b';
                      e.currentTarget.style.color = '#c0392b';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = theme.border.default;
                      e.currentTarget.style.color = theme.text.secondary;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 30px',
                      background: loading ? '#95a5a6' : 'linear-gradient(120deg, #c0392b, #e74c3c)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '18px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Result' : 'Add Result')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }; }, []);

  // Employee Management Page
  const EmployeesAdminPage = useMemo(() => { return function EmployeesAdminPageInner() {
    // Shadow outer-scope variables with fresh values from refs.
    const employees = employeesRef.current;
    const theme = themeRef.current;
    const isDarkMode = isDarkModeRef.current;
    const isMobile = isMobileRef.current;
    const colors = colorsRef.current;
    const [localEmployees, setLocalEmployees] = useState(employees);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formData, setFormData] = useState({ ID: '', Name: '' });
    const [msg, setMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeCurrentPage, setEmployeeCurrentPage] = useState(1);
    const [employeeGoToPage, setEmployeeGoToPage] = useState('');
    const employeeItemsPerPage = 50;

    useEffect(() => setLocalEmployees(employees), [employees]);

    // Filter employees based on search
    const filteredEmployees = localEmployees.filter(emp => {
      if (!searchQuery) return true;
      if (searchType === 'id') {
        return String(emp.ID).toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        return String(emp.Name).toLowerCase().includes(searchQuery.toLowerCase());
      }
    });

    const totalEmployeePages = Math.ceil(filteredEmployees.length / employeeItemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
      (employeeCurrentPage - 1) * employeeItemsPerPage,
      employeeCurrentPage * employeeItemsPerPage
    );

    useEffect(() => {
      setEmployeeCurrentPage(1);
    }, [searchType, searchQuery]);

    useEffect(() => {
      if (totalEmployeePages > 0 && employeeCurrentPage > totalEmployeePages) {
        setEmployeeCurrentPage(totalEmployeePages);
      }
    }, [employeeCurrentPage, totalEmployeePages]);

    const refreshEmployees = async () => {
      const data = await fetchData('/employees');
      setEmployees(data);
      setLocalEmployees(data);
    };

    const handleAdd = () => {
      setEditMode(false);
      setCurrentEmployee(null);
      setFormData({ ID: '', Name: '' });
      setShowModal(true);
    };

    const handleEdit = (employee) => {
      setEditMode(true);
      setCurrentEmployee(String(employee.ID));
      setFormData({ ID: employee.ID, Name: employee.Name });
      setShowModal(true);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const addModeId = String(formData.ID || '').trim();
      const editModeId = String(currentEmployee ?? formData.ID ?? '');
      const id = editMode ? editModeId : addModeId;
      const name = String(formData.Name || '').trim();
      
      if (!id || !name) {
        showToast('Please fill all fields', 'error');
        return;
      }

      setSaving(true);
      try {
        if (editMode) {
          // Use upsert endpoint in edit mode as well for safer name updates.
          await createEmployee({ ID: id, Name: name });
          setEmployees(prev => prev.map(emp =>
            String(emp.ID) === String(id) ? { ...emp, Name: name } : emp
          ));
          setLocalEmployees(prev => prev.map(emp =>
            String(emp.ID) === String(id) ? { ...emp, Name: name } : emp
          ));
          setMsg('Employee updated successfully');
          showToast('Employee updated successfully!', 'success');
        } else {
          await createEmployee({ ID: id, Name: name });
          setEmployees(prev => {
            const exists = prev.some(emp => String(emp.ID) === String(id));
            if (exists) {
              return prev.map(emp => (String(emp.ID) === String(id) ? { ...emp, Name: name } : emp));
            }
            return [...prev, { ID: id, Name: name }];
          });
          setLocalEmployees(prev => {
            const exists = prev.some(emp => String(emp.ID) === String(id));
            if (exists) {
              return prev.map(emp => (String(emp.ID) === String(id) ? { ...emp, Name: name } : emp));
            }
            return [...prev, { ID: id, Name: name }];
          });
          setMsg('Employee added successfully');
          showToast('Employee added successfully!', 'success');
        }
        await refreshEmployees();
        await loadResults();
        setShowModal(false);
        setEditMode(false);
        setCurrentEmployee(null);
        setFormData({ ID: '', Name: '' });
        setTimeout(() => setMsg(''), 3000);
      } catch (error) {
        showToast(`Failed: ${error.message}`, 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleDelete = async (employeeId) => {
      if (!window.confirm(`Are you sure you want to delete employee ${employeeId}?`)) return;
      
      try {
        await deleteEmployee(employeeId);
        setMsg('Employee deleted successfully');
        showToast('Employee deleted successfully!', 'success');
        await refreshEmployees();
        setTimeout(() => setMsg(''), 3000);
      } catch (error) {
        showToast(`Failed to delete: ${error.message}`, 'error');
      }
    };

    return (
      <div>
        {/* Hidden trigger button */}
        <button id="employees-add-btn" onClick={handleAdd} style={{ display: 'none' }} />

        {msg && (
            <div style={{
              padding: '15px',
              marginBottom: '20px',
              backgroundColor: msg.includes('success') ? '#d4edda' : '#f8d7da',
              color: msg.includes('success') ? '#155724' : '#721c24',
              borderRadius: '5px',
              border: `1px solid ${msg.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {msg}
            </div>
          )}

          {/* Search/Filter Card */}
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
            border: `1px solid ${theme.border.default}`,
            marginBottom: '25px'
          }}>
            {/* Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              padding: '18px 25px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color="#fff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2em', fontWeight: '600', textAlign: 'left' }}>Employee Management</h3>
                <p style={{ margin: 0, marginTop: '4px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85em', textAlign: 'left' }}>View And Manage Employee Records</p>
              </div>
            </div>

            {/* Search Filters */}
            <div style={{ 
              padding: '20px 25px', 
              backgroundColor: colors.cardAltBg,
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
            <div style={{ minWidth: isMobile ? '100%' : '180px' }}>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: `2px solid ${colors.inputBorder}`,
                  borderRadius: '4px',
                    fontSize: '0.95em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                <option value="id">Employee ID</option>
                <option value="name">Employee Name</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
              <input
                type="text"
                placeholder={`Search by ${searchType === 'id' ? 'Employee ID' : 'Employee Name'}...`}
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  if (searchType === 'id') {
                    // Only allow numbers for Employee ID
                    if (value === '' || /^[0-9]+$/.test(value)) {
                      setSearchQuery(value);
                    }
                  } else {
                    setSearchQuery(value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: `2px solid ${colors.inputBorder}`,
                  borderRadius: '4px',
                    fontSize: '0.95em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: colors.inputBg,
                  color: colors.text
                }}
              />
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setEmployeeCurrentPage(1);
              }}
              disabled={!searchQuery}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: colors.inputBg,
                color: colors.textMuted,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '28px',
                cursor: searchQuery ? 'pointer' : 'not-allowed',
                fontSize: '0.95em',
                fontWeight: '500',
                opacity: searchQuery ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (searchQuery) {
                  e.currentTarget.style.borderColor = '#c0392b';
                  e.currentTarget.style.color = '#c0392b';
                  e.currentTarget.style.backgroundColor = colors.cardBg;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = colors.inputBorder;
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.backgroundColor = colors.inputBg;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
              Clear Filter
            </button>
            </div>
          </div>

          {/* Table Card */}
          <div style={{
            backgroundColor: colors.cardBg,
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={commonStyles.table}>
                <thead>
                  <tr style={{ backgroundColor: colors.tableHeaderBg, color: 'white' }}>
                    <th style={{ padding: '18px 20px', textAlign: 'left', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Employee ID</th>
                    <th style={{ padding: '18px 20px', textAlign: 'left', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Employee Name</th>
                    <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600', fontSize: '0.95em', color: '#fff' }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((employee, index) => (
                  <tr key={index} style={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: isDarkMode ? colors.tableRowBg : 'transparent'
                  }}>
                    <td style={{ padding: '12px', border: `1px solid ${colors.border}`, color: colors.text }}>{employee.ID}</td>
                    <td style={{ padding: '12px', border: `1px solid ${colors.border}`, color: colors.text }}>{employee.Name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
                      <button
                        onClick={() => handleEdit(employee)}
                        style={{
                          padding: '8px',
                          backgroundColor: '#1a1a2e',
                          color: 'white',
                          border: '2px solid #1a1a2e',
                          borderRadius: '28px',
                          cursor: 'pointer',
                          marginRight: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        title="Edit Employee"
                        onMouseOver={e => {
                          e.currentTarget.style.backgroundColor = '#e1e2e2ff';
                          e.currentTarget.style.color = '#1a1a2e';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.backgroundColor = '#1a1a2e';
                          e.currentTarget.style.color = 'white';
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.ID)}
                        style={{
                          padding: '8px',
                          background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                          color: 'white',
                          border: '2px solid transparent',
                          borderRadius: '28px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        title="Delete Employee"
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#e1e2e2ff';
                          e.currentTarget.style.border = '2px solid #c0392b';
                          e.currentTarget.style.color = '#c0392b';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'linear-gradient(120deg, #c0392b, #e74c3c)';
                          e.currentTarget.style.border = '2px solid transparent';
                          e.currentTarget.style.color = 'white';
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: colors.textMuted }}>
                      {searchQuery ? 'No matching employees found' : 'No employees found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {totalEmployeePages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                padding: '14px 16px',
                backgroundColor: colors.cardBg,
                borderTop: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => setEmployeeCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={employeeCurrentPage === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: employeeCurrentPage === 1 ? colors.border : '#1a1a2e',
                    color: employeeCurrentPage === 1 ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: employeeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  color: colors.text,
                  fontWeight: '600',
                  fontSize: '14px',
                  padding: '0 10px'
                }}>
                  Page {employeeCurrentPage} of {totalEmployeePages} ({filteredEmployees.length} employees)
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: colors.textMuted, fontWeight: '600', fontSize: '12px' }}>Go to</span>
                  <input
                    type="number"
                    min="1"
                    max={totalEmployeePages}
                    value={employeeGoToPage}
                    onChange={(e) => setEmployeeGoToPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      const nextPage = parseInt(employeeGoToPage, 10);
                      if (!Number.isFinite(nextPage)) return;
                      setEmployeeCurrentPage(Math.min(totalEmployeePages, Math.max(1, nextPage)));
                      setEmployeeGoToPage('');
                    }}
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      textAlign: 'center',
                      backgroundColor: colors.cardAltBg,
                      color: colors.text
                    }}
                  />
                  <button
                    onClick={() => {
                      const nextPage = parseInt(employeeGoToPage, 10);
                      if (!Number.isFinite(nextPage)) return;
                      setEmployeeCurrentPage(Math.min(totalEmployeePages, Math.max(1, nextPage)));
                      setEmployeeGoToPage('');
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a2e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    Go
                  </button>
                </div>

                <button
                  onClick={() => setEmployeeCurrentPage(prev => Math.min(totalEmployeePages, prev + 1))}
                  disabled={employeeCurrentPage === totalEmployeePages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: employeeCurrentPage === totalEmployeePages ? colors.border : '#1a1a2e',
                    color: employeeCurrentPage === totalEmployeePages ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: employeeCurrentPage === totalEmployeePages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>

        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(26, 26, 46, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            marginLeft: 0
          }}>
            <div style={{
              backgroundColor: theme.bg.card,
              padding: isMobile ? '22px 16px' : '35px',
              borderRadius: '28px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '550px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: `0 20px 60px ${isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0, 0, 0, 0.3)'}`,
              animation: 'fadeIn 0.2s ease'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: '25px',
                color: colors.text,
                fontSize: '1.6em',
                fontWeight: '600',
                borderBottom: '3px solid #c0392b',
                paddingBottom: '15px'
              }}>
                {editMode ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: colors.text,
                    fontSize: '0.95em'
                  }}>
                    Employee ID:
                  </label>
                  <input
                    type="text"
                    value={formData.ID}
                    onChange={(e) => setFormData({ ...formData, ID: e.target.value })}
                    disabled={editMode}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: `2px solid ${colors.inputBorder}`,
                      borderRadius: '4px',
                        fontSize: '15px',
                      backgroundColor: editMode ? colors.cardAltBg : colors.inputBg,
                      color: colors.text,
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => !editMode && (e.target.style.borderColor = '#1a1a2e')}
                    onBlur={e => e.target.style.borderColor = colors.inputBorder}
                    required
                  />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: colors.text,
                    fontSize: '0.95em'
                  }}>
                    Employee Name:
                  </label>
                  <input
                    type="text"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: `2px solid ${colors.inputBorder}`,
                      borderRadius: '4px',
                        fontSize: '15px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: colors.inputBg,
                      color: colors.text
                    }}
                    onFocus={e => e.target.style.borderColor = '#1a1a2e'}
                    onBlur={e => e.target.style.borderColor = colors.inputBorder}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: theme.bg.card,
                      color: theme.text.secondary,
                      border: `2px solid ${theme.border.default}`,
                      borderRadius: '28px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      opacity: saving ? 0.5 : 1
                    }}
                    onMouseOver={e => !saving && (e.currentTarget.style.borderColor = '#c0392b', e.currentTarget.style.color = '#c0392b')}
                    onMouseOut={e => !saving && (e.currentTarget.style.borderColor = colors.inputBorder, e.currentTarget.style.color = colors.textMuted)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '12px 30px',
                      background: saving ? '#95a5a6' : 'linear-gradient(120deg, #c0392b, #e74c3c)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '18px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      opacity: saving ? 0.5 : 1
                    }}
                    onMouseOver={e => {
                      if (!saving) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!saving) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {saving ? 'Saving...' : (editMode ? 'Update Employee' : 'Add Employee')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }; }, []);

  // Main Render
  return (
    <>
      {/* Toast Notifications */}
      <ToastHost isDarkMode={isDarkMode} />

      {currentPage === 'home' && <HomePage 
        activeLoginForm={activeLoginForm}
        setActiveLoginForm={setActiveLoginForm}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        employeeName={employeeName}
        selectedStandard={selectedStandard}
        handleStandardSelect={handleStandardSelect}
        testInfo={testInfo}
        standards={standards}
        employees={employees}
        dataLoaded={dataLoaded}
        loading={loading}
        handleStartTest={handleStartTest}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleAdminLogin={handleAdminLogin}
        error={error}
        idInputRef={idInputRef}
        fillEmployeeNameFromTypedId={fillEmployeeNameFromTypedId}
        showToast={showToast}
      />}
      {currentPage === 'test' && <TestPage showToast={showToast} />}
      {currentPage === 'result' && <ResultPage showToast={showToast} />}
      {currentPage === 'admin' && <AdminPage />}
    </>
  );
};

export default TestingModule;





