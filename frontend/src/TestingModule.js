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
  Search
} from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import StandardsAdminPage from './admin/StandardsAdminPage';
import QuestionsAdminPage from './admin/QuestionsAdminPage';
import ptisLogo from './assets/ptisLogo.png';
import './LoginPage.css';

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
  fillEmployeeNameFromTypedId
}) => (
  <div className="login-backdrop">
    <div className="login-main-container">
      {/* Left Side - Branding */}
      <div className="login-right-container">
        <div className="orbit-ring"></div>
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
                  color: '#ffffff'
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
              <a href="#">Need Help?</a>
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
                  style={{ paddingRight: '45px' }}
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
              <a href="#">Need Help?</a>
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
  const API_BASE_URL = 'http://localhost:3001';
  const { theme, isDarkMode, toggleTheme } = useTheme();

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
  
  // Certificate generation certification type state (stores cert type per result)
  const [certTypes, setCertTypes] = useState({}); // key: result index, value: 'New' or 'Recertification'

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

    const stdNorm = normalizeStandard(standard);
    const isCumulative = stdNorm.includes('cumulative') || stdNorm.includes('cummulative');

    if (isCumulative) {
      let allQuestions = [];
      for (const st of standards) {
        const stData = await fetchData(`/questions?standard=${encodeURIComponent(st.Standard_List)}`);
        allQuestions = [...allQuestions, ...stData];
      }
      processedData = shuffle(allQuestions).slice(0, 50);
    } else {
      if (processedData.length > 0) {
        processedData = shuffle(processedData);
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

  const handleStartTest = () => {
    if (!selectedEmployee || !selectedStandard) {
      setError('Please select both employee and standard');
      return;
    }
    if (!testInfo || !questions.length) {
      setError('Test information or questions not loaded. Please try again.');
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
    const status = percentage >= (testInfo?.Passing_Criteria || 70) ? 'Pass' : 'Fail';

    // Use STANDARD consistently (DB column is STANDARD)
    const result = {
      ID: selectedEmployee,
      NAME: employeeName,
      TOTAL_QUESTION: totalQuestions,
      CORRECT_ANSWER: right,
      WRONG_ANSWER: wrong,
      PERCENTAGE: `${percentage.toFixed(2)}%`,
      PASSING_CRITERIA: String(testInfo?.Passing_Criteria || 70).includes('%')
        ? String(testInfo?.Passing_Criteria)
        : `${testInfo?.Passing_Criteria || 70}%`,
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
    } else {
      setError('Invalid Admin Password');
    }
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

    // Ascending so the latest appears LAST
    resultsData.sort((a, b) => toEpochFromPk(a.DATE) - toEpochFromPk(b.DATE));

    console.log('Loaded results:', resultsData);
    setResults(resultsData);
    if (showLoader) setAdminLoading(false);
  }, [fetchData]);

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
      return true;
    } catch (err) {
      setError('Failed to Save Result to Database: ' + err.message);
      console.error('Error Saving Result:', err);
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

  const updateEmployee = async ({ ID, Name }) => {
    const resp = await fetch(`${API_BASE_URL}/api/employees/${encodeURIComponent(ID)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Name })
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
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, timeRemaining, testCompleted]);

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
      padding: '30px',
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
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                backgroundColor: theme.bg.card,
                border: `2px solid ${theme.border.default}`,
                borderRadius: '25px',
                padding: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
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
              <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                PTIS Test
              </h1>
              <span style={{ background: 'linear-gradient(120deg, #c0392b, #e74c3c)', color: '#fff', padding: '5px 15px', borderRadius: '28px', fontSize: '0.9em', fontWeight: 'bold' }}>
                {selectedStandard}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                <span style={{ fontFamily: 'monospace', fontSize: '1.2em', fontWeight: 'bold' }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '5px 15px', borderRadius: '28px', fontSize: '0.9em' }}>
                {isReviewingSkipped
                  ? `Review ${currentQuestion + 1} of ${questions.length} skipped`
                  : `Question ${currentQuestion + 1} of ${originalQuestions.length} (Attempted: ${attemptedCount})`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
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

          <div style={{ backgroundColor: theme.bg.card, borderRadius: '16px', boxShadow: `0 4px 20px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`, padding: '30px', marginBottom: '25px', border: `1px solid ${theme.border.light}` }}>
            {question ? (
              <>
                <h2 style={{ fontSize: '1.4em', fontWeight: '600', marginBottom: '25px', color: theme.text.primary, lineHeight: '1.4' }}>
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
                          padding: '18px',
                          border: `2px solid ${isSelected ? theme.accent.primary : theme.border.default}`,
                          borderRadius: '28px',
                          backgroundColor: isSelected ? (isDarkMode ? 'rgba(192, 57, 43, 0.2)' : '#ecf0f1') : theme.bg.card,
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '15px',
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
    };

    return (
      <div style={{ minHeight: '100vh', height: '100%', background: 'linear-gradient(135deg, #f5f6f5 0%, #e6f0fa 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            backgroundColor: colors.cardBg,
            borderRadius: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            padding: '40px',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              {testResult.STATUS?.toUpperCase() === 'PASS' ? (
                <>
                  <CheckCircle size={80} color="#27ae60" style={{ marginBottom: '20px' }} />
                  <h1 style={{
                    fontSize: '2.5em',
                    fontWeight: 'bold',
                    color: '#27ae60',
                    margin: '0 0 10px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Congratulations!
                  </h1>
                  <p style={{ fontSize: '1.2em', color: colors.textMuted, margin: 0 }}>
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
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Test Not Passed
                  </h1>
                  <p style={{ fontSize: '1.2em', color: colors.textMuted, margin: 0 }}>
                    Please Review And Try Again
                  </p>
                </>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px',
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
                  color: '#1a1a2e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <User size={24} color="#1a1a2e" />
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
                    <span style={{ fontWeight: 'bold', color: '#1a1a2e', fontSize: '1.1em' }}>
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
                    <span style={{ fontWeight: 'bold', color: '#1a1a2e', fontSize: '1.1em' }}>
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
                      backgroundColor: '#1a1a2e',
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
                    <span style={{ fontWeight: 'bold', color: '#1a1a2e', fontSize: '1.1em' }}>
                      {testResult.DATE}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: testResult.STATUS?.toUpperCase() === 'PASS' ? '#e8f5e8' : '#fadbd8',
                borderRadius: '8px',
                padding: '25px',
                border: `2px solid ${testResult.STATUS?.toUpperCase() === 'PASS' ? '#c8e6c9' : '#c0392b'}`,
                boxShadow: testResult.STATUS?.toUpperCase() !== 'PASS' ? '0 0 20px rgba(192, 57, 43, 0.2)' : 'none'
              }}>
                <h3 style={{
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: '#1a1a2e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <BarChart3 size={24} color="#1a1a2e" />
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
                    <span style={{ fontWeight: 'bold', color: '#1a1a2e', fontSize: '1.2em' }}>
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
                    <span style={{ fontWeight: 'bold', color: '#1a1a2e', fontSize: '1.1em' }}>
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
                      color: testResult.STATUS?.toUpperCase() === 'PASS' ? '#27ae60' : '#e74c3c',
                      textShadow: '0 1px 3px rgba(0,0,0,0.1)'
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

  // ---------- Admin Page (Professional Dashboard with Sidebar) ----------
  const AdminPage = () => {
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
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

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
        const matchName = filterEmpName ? norm(r.NAME) === norm(filterEmpName) : true;
        const matchStatus = filterStatus === 'All' ? true : normLower(r.STATUS) === normLower(filterStatus);
        const matchStd = filterStandard === 'All' ? true : norm(r.STANDARD) === norm(filterStandard);
        return matchId && matchName && matchStatus && matchStd;
      });
    }, [results, filterEmpId, filterEmpName, filterStatus, filterStandard]);

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

    // Scroll detection for header animation
    useEffect(() => {
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setShowHeader(false);
        } else if (currentScrollY < lastScrollY) {
          setShowHeader(true);
        }
        setLastScrollY(currentScrollY);
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
        const { theme, isDarkMode } = useTheme();
        const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
        const [searchQuery, setSearchQuery] = useState('');

      const filteredResults = useMemo(() => {
        let passed = results.filter(r => isPass(r.STATUS));
        
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
        
        // Group PT/MPT/UT/VT tests by employee
        const grouped = {};
        passed.forEach(r => {
          const standard = norm(r.STANDARD);
          const empId = norm(r.ID);
          
          // Check if this is a 2-row test (PT/MPT/UT/VT) - CHECK MPT/UT/VT BEFORE PT
          const isMagneticParticle = standard.includes('Magnetic Particle') || standard.includes('MPT (');
          const isUltrasonic = standard.includes('Ultrasonic') || standard.includes('UT (');
          const isVisual = standard.includes('Visual') || standard.includes('VT (');
          const isPenetrantTesting = standard.includes('Penetrant Testing') || standard.includes('PT (');
          
          if (isPenetrantTesting || isMagneticParticle || isUltrasonic || isVisual) {
            // Determine base type - check MPT, UT, VT first to avoid substring matching
            let baseType;
            if (isMagneticParticle) baseType = 'Magnetic Particle Testing';
            else if (isUltrasonic) baseType = 'Ultrasonic Testing';
            else if (isVisual) baseType = 'Visual Testing';
            else if (isPenetrantTesting) baseType = 'Penetrant Testing';
            
            // Determine test type (General, Specific, or Practical)
            let testType;
            if (standard.includes('(Practical)')) {
              testType = 'Practical';
            } else if (standard.includes('General')) {
              testType = 'General';
            } else if (standard.includes('Specific')) {
              testType = 'Specific';
            }
            
            const key = `${empId}_${baseType}`;
            
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
              grouped[key].general = r;
            } else if (testType === 'Specific') {
              grouped[key].specific = r;
            } else if (testType === 'Practical') {
              grouped[key].practical = r;
            }
          } else {
            // Regular certificate (non-PT/MPT)
            const key = `${empId}_${standard}`;
            grouped[key] = {
              empId,
              empName: norm(r.NAME),
              baseType: standard,
              single: r
            };
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
            
            // Add practical data if available
            if (group.practical) {
              resultData.PRACTICAL_DATA = group.practical;
            }
            
            finalResults.push(resultData);
          }
          // If only one test passed (general or specific), don't show button
        });
        
        return finalResults;
      }, [searchType, searchQuery, isPass, norm]);

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
            <div style={{ minWidth: '180px' }}>
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
            <div style={{ flex: '1', minWidth: '250px' }}>
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
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.cardBg,
                color: colors.textMuted,
                border: `2px solid ${colors.border}`,
                borderRadius: '28px',
                cursor: searchQuery ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                opacity: searchQuery ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (searchQuery) {
                  e.currentTarget.style.borderColor = '#c0392b';
                  e.currentTarget.style.color = '#c0392b';
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#2d1f1f' : '#fff5f5';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.backgroundColor = colors.cardBg;
              }}
            >
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
                    {filteredResults.map((result, index) => (
                      <tr 
                        key={index}
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
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <select
                            value={certTypes[index] || 'New'}
                            onChange={(e) => setCertTypes({ ...certTypes, [index]: e.target.value })}
                            style={{
                              padding: '8px 12px',
                              border: certTypes[index] === 'Recertification' ? '2px solid #16213e' : '2px solid #16a085',
                              borderRadius: '28px',
                              fontSize: '14px',
                              fontWeight: '600',
                              backgroundColor: certTypes[index] === 'Recertification' ? '#16213e' : '#16a085',
                              color: 'white',
                              cursor: 'pointer',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <option value="New" style={{ backgroundColor: theme.bg.input, color: theme.text.primary }}>New</option>
                            <option value="Recertification" style={{ backgroundColor: theme.bg.input, color: theme.text.primary }}>Re-Certification</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            onClick={async () => {
                              try {
                                const selectedCertType = certTypes[index] || 'New';
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
                                
                                alert(`Certificate generated successfully for ${norm(result.NAME)}!`);
                              } catch (error) {
                                console.error('Certificate generation error:', error);
                                alert(`Failed to generate certificate: ${error.message}`);
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    };
    }, [norm, isPass, toPctNumber]); // Only recreate if utility functions change

    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg.primary }}>
        {/* Sidebar */}
        <div 
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{
          width: sidebarHovered ? '260px' : '80px',
          backgroundColor: '#1a1a2e',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          borderTopRightRadius: '20px',
          borderBottomRightRadius: '20px',
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
                backgroundColor: theme.bg.card,
                border: `2px solid ${theme.border.default}`,
                borderRadius: '25px',
                padding: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                overflow: 'hidden'
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
                    justifyContent: sidebarHovered ? 'flex-start' : 'center',
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
                  {sidebarHovered && item.label}
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
                width: sidebarHovered ? '100%' : '45px',
                height: sidebarHovered ? 'auto' : '45px',
                padding: sidebarHovered ? '12px' : '0',
                background: 'linear-gradient(120deg, #c0392b, #e74c3c)',
                color: '#fff',
                border: '2px solid transparent',
                borderRadius: sidebarHovered ? '28px' : '25px',
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
              {sidebarHovered && 'Logout'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ marginLeft: '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top Header Bar */}
          <div style={{
            backgroundColor: theme.bg.card,
            boxShadow: `0 2px 4px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
            padding: '20px 30px',
            borderBottom: '3px solid transparent',
            borderImage: 'linear-gradient(90deg, #c0392b, #e74c3c, #c0392b) 1',
            borderRadius: '18px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s ease-in-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, color: theme.text.primary, fontSize: '1.8em', fontWeight: 'bold' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                {(adminActiveTab === 'dashboard' || adminActiveTab === 'results' || adminActiveTab === 'certificates') ? null : (
                <button
                  onClick={() => {
                    if (adminActiveTab === 'standards') {
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
                    fontSize: '0.95em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Plus size={18} style={{ transition: 'color 0.3s ease' }} />
                  Add New {adminActiveTab === 'standards' ? 'Standard' : adminActiveTab === 'questions' ? 'Question' : adminActiveTab === 'practical' ? 'Practical Result' : 'Employee'}
                </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: theme.bg.primary, minHeight: '100vh' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
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
                            <linearGradient id="passGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#27ae60" />
                              <stop offset="100%" stopColor="#2ecc71" />
                            </linearGradient>
                            <linearGradient id="failGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#c0392b" />
                              <stop offset="100%" stopColor="#e74c3c" />
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
                          >
                            {[
                              { name: 'Passed', value: passedTests, color: 'url(#passGradient)' },
                              { name: 'Failed', value: failedTests, color: 'url(#failGradient)' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          {results.slice(0, 10).map((result, index) => (
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
                          disabled={!filterEmpId && !filterEmpName && filterStatus === 'All' && filterStandard === 'All'}
                          style={{ 
                            padding: '12px 24px',
                            backgroundColor: colors.inputBg,
                            color: colors.textMuted,
                            border: `2px solid ${colors.inputBorder}`,
                            borderRadius: '28px',
                            cursor: (filterEmpId || filterEmpName || filterStatus !== 'All' || filterStandard !== 'All') ? 'pointer' : 'not-allowed',
                            fontSize: '0.95em',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            opacity: (filterEmpId || filterEmpName || filterStatus !== 'All' || filterStandard !== 'All') ? 1 : 0.5
                          }}
                          onMouseOver={e => {
                            if (filterEmpId || filterEmpName || filterStatus !== 'All' || filterStandard !== 'All') {
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
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtered Charts Section */}
                {filteredResults.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
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
                            <linearGradient id="resultsPassGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#27ae60" />
                              <stop offset="100%" stopColor="#2ecc71" />
                            </linearGradient>
                            <linearGradient id="resultsFailGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#c0392b" />
                              <stop offset="100%" stopColor="#e74c3c" />
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
                          >
                            {[
                              { name: 'Passed', value: passedTests, color: 'url(#resultsPassGradient)' },
                              { name: 'Failed', value: failedTests, color: 'url(#resultsFailGradient)' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          data={filteredResults.slice(-20).map((r, idx) => ({
                            test: `Test ${idx + 1}`,
                            score: toPctNumber(r.PERCENTAGE),
                            name: norm(r.NAME)
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} />
                          <XAxis dataKey="test" tick={{ fill: theme.text.primary }} />
                          <YAxis domain={[0, 100]} tick={{ fill: theme.text.primary }} />
                          <Tooltip contentStyle={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.default}`, color: theme.text.primary }} />
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
                          {filteredResults.map((result, index) => {
                            const handleDeleteResult = async () => {
                              if (!window.confirm(`Are you sure you want to delete this test result for ${result.NAME}?`)) return;
                              try {
                                const response = await fetch(
                                  `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}`,
                                  { method: 'DELETE' }
                                );
                                if (!response.ok) throw new Error('Delete failed');
                                alert('Result deleted successfully!');
                                loadResults(true);
                              } catch (error) {
                                console.error('Error deleting result:', error);
                                alert('Failed to delete result');
                              }
                            };

                            const handleDownloadPDF = () => {
                              const url = `${API_BASE_URL}/api/results/${encodeURIComponent(result.ID)}/${encodeURIComponent(result.STANDARD)}/${encodeURIComponent(result.DATE)}/pdf`;
                              window.open(url, '_blank');
                            };

                            return (
                              <tr key={`${result.ID}-${result.STANDARD}-${result.DATE}-${index}`} style={{ 
                                borderBottom: `1px solid ${colors.border}`,
                                backgroundColor: isDarkMode ? colors.tableRowBg : 'transparent'
                              }}>
                                <td style={commonStyles.td}>{index + 1}</td>
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
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={handleDownloadPDF}
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
                                      title="Download Test Sheet PDF"
                                      onMouseOver={e => {
                                        e.currentTarget.style.backgroundColor = '#e1e2e2ff';
                                        e.currentTarget.style.color = '#1a1a2e';
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.backgroundColor = '#1a1a2e';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button
                                      onClick={handleDeleteResult}
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
                </div>

                {/* Removed certification type edit modal - now handled at certificate generation time */}
              </>
            )}

            {/* Standards Tab */}
            {adminActiveTab === 'standards' && (
              <StandardsAdminPage onBack={() => setAdminActiveTab('dashboard')} />
            )}

            {/* Questions Tab */}
            {adminActiveTab === 'questions' && (
              <QuestionsAdminPage onBack={() => setAdminActiveTab('dashboard')} />
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
  };

  // Practical Results Management Page
  const PracticalResultsPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentResult, setCurrentResult] = useState(null);
    const [formData, setFormData] = useState({
      employeeId: '',
      employeeName: '',
      standard: '',
      standardFullName: '',
      totalQuestions: '100',
      correctAnswers: '',
      percentage: '',
      passingCriteria: '70'
    });
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique generalized standard names - practical is same for General and Specific
    const getGeneralizedStandards = () => {
      const generalizedNames = new Set();
      standards.forEach(s => {
        const stdName = s.Standard_List;
        // Replace (General) or (Specific) with (Practical)
        if (stdName.includes('(General)') || stdName.includes('(Specific)')) {
          const practicalName = stdName.replace('(General)', '(Practical)').replace('(Specific)', '(Practical)');
          generalizedNames.add(practicalName);
        }
      });
      return Array.from(generalizedNames).sort();
    };

    const practicalStandards = getGeneralizedStandards();

    // Get practical results from all results
    const allPracticalResults = results.filter(r => 
      r.STANDARD && r.STANDARD.includes('(Practical)')
    );

    // Filter practical results based on search
    const practicalResults = allPracticalResults.filter(result => {
      if (!searchQuery) return true;
      if (searchType === 'id') {
        return String(result.ID).toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        return String(result.NAME).toLowerCase().includes(searchQuery.toLowerCase());
      }
    });

    // Get employees eligible for practical (passed both General and Specific)
    const getEligibleEmployees = () => {
      const grouped = {};
      const passed = results.filter(r => r.STATUS && r.STATUS.toUpperCase() === 'PASS');
      
      console.log('All passed results:', passed.map(r => ({ id: r.ID, name: r.NAME, standard: r.STANDARD })));
      
      passed.forEach(r => {
        const standard = r.STANDARD;
        const empId = String(r.ID);
        
        // Skip if already practical result
        if (standard.includes('(Practical)')) {
          return;
        }
        
        // Check for 2-row standards - CHECK MPT/UT/VT BEFORE PT to avoid substring matching
        const isMagneticParticle = standard.includes('Magnetic Particle') || standard.includes('MPT (') || standard.startsWith('MPT');
        const isUltrasonic = standard.includes('Ultrasonic') || standard.includes('UT (') || standard.startsWith('UT');
        const isVisual = standard.includes('Visual') || standard.includes('VT (') || standard.startsWith('VT');
        const isPenetrantTesting = standard.includes('Penetrant Testing') || standard.includes('PT (');
        
        console.log(`Checking ${standard}:`, { isPenetrantTesting, isMagneticParticle, isUltrasonic, isVisual });
        
        if (isPenetrantTesting || isMagneticParticle || isUltrasonic || isVisual) {
          let baseType;
          // Check in order: MPT, UT, VT first, then PT (to avoid substring matching)
          if (isMagneticParticle) baseType = 'Magnetic Particle Testing';
          else if (isUltrasonic) baseType = 'Ultrasonic Testing';
          else if (isVisual) baseType = 'Visual Testing';
          else if (isPenetrantTesting) baseType = 'Penetrant Testing';
          
          console.log(`Setting baseType for ${standard}: ${baseType}`);
          
          const key = `${empId}_${baseType}`;
          
          console.log(`Creating key: ${key}`);
          
          if (!grouped[key]) {
            grouped[key] = {
              empId,
              empName: r.NAME,
              baseType,
              general: false,
              specific: false,
              practical: false
            };
            console.log(`Created new entry for ${key}`);
          }
          
          const hasGeneral = standard.includes('General') || standard.includes('(General)');
          const hasSpecific = standard.includes('Specific') || standard.includes('(Specific)');
          
          console.log(`${standard} - hasGeneral: ${hasGeneral}, hasSpecific: ${hasSpecific}`);
          
          if (hasGeneral) {
            grouped[key].general = true;
            console.log(`Set general=true for ${key}`);
          } else if (hasSpecific) {
            grouped[key].specific = true;
            console.log(`Set specific=true for ${key}`);
          }
        }
      });
      
      console.log('Grouped results:', JSON.stringify(grouped, null, 2));
      console.log('MPT entry check:', grouped['2_Magnetic Particle Testing']);
      
      // Check for existing practical results and mark them
      passed.forEach(r => {
        if (r.STANDARD.includes('(Practical)')) {
          const standard = r.STANDARD.replace(' (Practical)', '');
          const empId = String(r.ID);
          
          let baseType;
          if (standard.includes('Penetrant Testing') || standard === 'PT') baseType = 'Penetrant Testing';
          else if (standard.includes('Magnetic Particle') || standard === 'MPT') baseType = 'Magnetic Particle Testing';
          else if (standard.includes('Ultrasonic') || standard === 'UT') baseType = 'Ultrasonic Testing';
          else if (standard.includes('Visual') || standard === 'VT') baseType = 'Visual Testing';
          
          if (baseType) {
            const key = `${empId}_${baseType}`;
            if (grouped[key]) {
              grouped[key].practical = true;
            }
          }
        }
      });
      
      // Return only those who passed both General and Specific
      const eligible = Object.values(grouped).filter(g => g.general && g.specific);
      console.log('Eligible employees:', eligible);
      return eligible;
    };

    const eligibleEmployees = getEligibleEmployees();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      const employee = employees.find(emp => String(emp.ID) === String(formData.employeeId));
      if (!employee) {
        alert('Employee not found');
        setLoading(false);
        return;
      }

      // Use abbreviation directly - formData.standard already contains the abbreviation (MPT, PT, UT, VT)
      const totalQ = parseInt(formData.totalQuestions) || 100;
      const correctA = parseInt(formData.correctAnswers) || 0;
      const percentage = ((correctA / totalQ) * 100).toFixed(2);
      
      const resultData = {
        ID: formData.employeeId,
        NAME: employee.Name,
        TOTAL_QUESTION: totalQ,
        CORRECT_ANSWER: correctA,
        WRONG_ANSWER: totalQ - correctA,
        PERCENTAGE: `${percentage}%`,
        PASSING_CRITERIA: `${formData.passingCriteria}%`,
        STATUS: parseFloat(percentage) >= parseFloat(formData.passingCriteria) ? 'Pass' : 'Fail',
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
          alert(editMode ? 'Practical result updated successfully!' : 'Practical result added successfully!');
          setShowModal(false);
          setEditMode(false);
          setCurrentResult(null);
          setFormData({ employeeId: '', employeeName: '', standard: '', standardFullName: '', totalQuestions: '100', correctAnswers: '', percentage: '', passingCriteria: '70' });
          loadResults(true);
        } else {
          alert(editMode ? 'Failed to update practical result' : 'Failed to add practical result');
        }
      } catch (error) {
        console.error('Error saving practical result:', error);
        alert('Error saving practical result');
      }

      setLoading(false);
    };

    const handleEdit = (result) => {
      // Extract standard abbreviation from full name
      const standardText = result.STANDARD.replace(' (Practical)', '');
      let standardAbbr = '';
      if (standardText.includes('Penetrant Testing')) standardAbbr = 'PT';
      else if (standardText.includes('Magnetic Particle')) standardAbbr = 'MPT';
      else if (standardText.includes('Ultrasonic')) standardAbbr = 'UT';
      else if (standardText.includes('Visual')) standardAbbr = 'VT';
      
      setCurrentResult(result);
      setEditMode(true);
      setFormData({
        employeeId: result.ID,
        employeeName: result.NAME,
        standard: standardAbbr,
        standardFullName: standardText,
        totalQuestions: String(result.TOTAL_QUESTION || 100),
        correctAnswers: String(result.CORRECT_ANSWER || 0),
        percentage: result.PERCENTAGE ? result.PERCENTAGE.replace('%', '') : '',
        passingCriteria: result.PASSING_CRITERIA ? result.PASSING_CRITERIA.replace('%', '') : '70'
      });
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
          alert('Practical result deleted successfully!');
          loadResults(true);
        } else {
          alert('Failed to delete practical result');
        }
      } catch (error) {
        console.error('Error deleting practical result:', error);
        alert('Error deleting practical result');
      }
    };

    return (
      <div style={{ padding: '30px' }}>
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
            <div style={{ minWidth: '180px' }}>
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
            <div style={{ flex: '1', minWidth: '250px' }}>
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
                {eligibleEmployees.map((emp, index) => (
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
        )}

        {/* Practical Results Table */}
        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
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
              {practicalResults.map((result, index) => (
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
              ))}
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
              padding: '35px',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '650px',
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '22px' }}>
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
                      {[...new Set(eligibleEmployees.map(emp => emp.empId))].map(empId => (
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
                      {[...new Set(eligibleEmployees.map(emp => emp.empName))].map(empName => (
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '22px' }}>
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
                        const total = parseInt(e.target.value) || 0;
                        const correct = parseInt(formData.correctAnswers) || 0;
                        const percentage = total > 0 ? ((correct / total) * 100).toFixed(2) : '';
                        setFormData({ ...formData, totalQuestions: e.target.value, percentage });
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
                        const correct = parseInt(e.target.value) || 0;
                        const total = parseInt(formData.totalQuestions) || 0;
                        const percentage = total > 0 ? ((correct / total) * 100).toFixed(2) : '';
                        setFormData({ ...formData, correctAnswers: e.target.value, percentage });
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '22px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '0.95em'
                    }}>
                      Percentage (Auto-calculated):
                    </label>
                    <input
                      type="text"
                      value={formData.percentage ? `${formData.percentage}%` : ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: `2px solid ${colors.inputBorder}`,
                        borderRadius: '4px',
                        fontSize: '15px',
                        backgroundColor: colors.cardAltBg,
                        color: colors.text,
                        boxSizing: 'border-box'
                      }}
                      placeholder="Auto-calculated"
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
                      Passing Criteria (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingCriteria}
                      onChange={(e) => setFormData({ ...formData, passingCriteria: e.target.value })}
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

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px', paddingTop: '25px', borderTop: '2px solid #ecf0f1' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditMode(false);
                      setCurrentResult(null);
                      setFormData({ employeeId: '', employeeName: '', standard: '', standardFullName: '', totalQuestions: '100', correctAnswers: '', percentage: '', passingCriteria: '70' });
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
  };

  // Employee Management Page
  const EmployeesAdminPage = () => {
    const [localEmployees, setLocalEmployees] = useState(employees);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formData, setFormData] = useState({ ID: '', Name: '' });
    const [msg, setMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
    const [searchQuery, setSearchQuery] = useState('');

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
      setCurrentEmployee(employee.ID);
      setFormData({ ID: employee.ID, Name: employee.Name });
      setShowModal(true);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const id = String(formData.ID || '').trim();
      const name = String(formData.Name || '').trim();
      
      if (!id || !name) {
        alert('Please fill all fields');
        return;
      }

      setSaving(true);
      try {
        if (editMode) {
          await updateEmployee({ ID: id, Name: name });
          setMsg('Employee updated successfully');
        } else {
          await createEmployee({ ID: id, Name: name });
          setMsg('Employee added successfully');
        }
        await refreshEmployees();
        setShowModal(false);
        setTimeout(() => setMsg(''), 3000);
      } catch (error) {
        alert(`Failed: ${error.message}`);
      } finally {
        setSaving(false);
      }
    };

    const handleDelete = async (employeeId) => {
      if (!window.confirm(`Are you sure you want to delete employee ${employeeId}?`)) return;
      
      try {
        await deleteEmployee(employeeId);
        setMsg('Employee deleted successfully');
        await refreshEmployees();
        setTimeout(() => setMsg(''), 3000);
      } catch (error) {
        alert(`Failed to delete: ${error.message}`);
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
            <div style={{ minWidth: '180px' }}>
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
            <div style={{ flex: '1', minWidth: '250px' }}>
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
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.inputBg,
                color: colors.textMuted,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '28px',
                cursor: searchQuery ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
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
                {filteredEmployees.map((employee, index) => (
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
              padding: '35px',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '550px',
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
  };

  // Main Render
  return (
    <>
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
      />}
      {currentPage === 'test' && <TestPage />}
      {currentPage === 'result' && <ResultPage />}
      {currentPage === 'admin' && <AdminPage />}
    </>
  );
};

export default TestingModule;





