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
  Download
} from 'lucide-react';

const TestingModule = () => {
  const API_BASE_URL = 'http://localhost:3001';

  // State
  const [currentPage, setCurrentPage] = useState('home');
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

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
    setEmployees(employeesData);
    setStandards(standardsData);
    setDataLoaded(true);
    setLoading(false);
  };

  const fetchTestInfo = async (standard) => {
    const enc = encodeURIComponent(standard);
    const data = await fetchData(`/info?standard=${enc}`);
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
  const [isTypingId, setIsTypingId] = useState(false);

  // if we're actively typing, keep focus & caret at the end even on re-render
  useEffect(() => {
    if (isTypingId && idInputRef.current) {
      const el = idInputRef.current;
      const pos = el.value.length;
      el.focus({ preventScroll: true });
      try {
        el.setSelectionRange(pos, pos);
      } catch {}
    }
  }, [selectedEmployee, isTypingId]);

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

    setAnswers(prev => ({ ...prev, [question.NO]: selectedAnswer }));
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
          newSkipped.includes(q.NO) && !answers[q.NO]
        );

        if (skippedQuestions.length > 0) {
          setQuestions(skippedQuestions);
          setCurrentQuestion(0);
          setIsReviewingSkipped(true);
          return;
        }
      }
      if (newSkipped.length === 0) {
        handleTestComplete();
      }
    }
  };

  const handleSkipQuestion = () => {
    if (isReviewingSkipped) return;

    const question = questions[currentQuestion];
    if (!question) return;

    if (!skipped.includes(question.NO)) {
      setSkipped(prev => [...prev, question.NO]);
    }

    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleEndOfQuestions();
    }
  };

  const handleEndOfQuestions = () => {
    if (skipped.length > 0 && !isReviewingSkipped) {
      const skippedQuestions = originalQuestions.filter(q =>
        skipped.includes(q.NO) && !answers[q.NO]
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

  const handleTestComplete = async () => {
    setTestStarted(false);
    setTestCompleted(true);

    let right = 0;
    let wrong = 0;
    const totalQuestions = originalQuestions.length;

    originalQuestions.forEach(q => {
      if (answers[q.NO]) {
        if (answers[q.NO] === q.Answer) {
          right++;
        } else {
          wrong++;
        }
      }
    });

    const rawScore = right - (wrong * 0.25);
    const finalScore = Math.max(0, rawScore);
    const percentage = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;
    const status = percentage >= (testInfo?.Passing_Criteria || 70) ? 'PASS' : 'FAIL';

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
      FINAL_SCORE: finalScore.toFixed(2) // client-side only display
    };

    setTestResult(result);

    console.log('Saving result:', result);
    const saveSuccess = await saveResult(result);
    if (saveSuccess) {
      console.log('Result saved successfully');
      await loadResults();
    } else {
      setError('Failed to save test result to database. Please try again.');
    }

    setCurrentPage('result');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'AdminPtis-3692') {
      setIsAdmin(true);
      setCurrentPage('admin');
      setError('');
      loadResults(true);
      setAdminPassword('');
    } else {
      setError('Invalid admin password');
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
        throw new Error(`Failed to save result: ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log('Save result response:', responseData);
      return true;
    } catch (err) {
      setError('Failed to save result to database: ' + err.message);
      console.error('Error saving result:', err);
      return false;
    }
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
      borderRadius: '10px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      padding: '30px',
      textAlign: 'center'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
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
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '1em',
      boxSizing: 'border-box'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '20px',
      color: '#3498db'
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
      marginBottom: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.9em',
      color: '#2c3e50'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      color: '#7f8c8d',
      fontWeight: 'bold',
      borderBottom: '2px solid #dee2e6'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #eee'
    }
  };

  // Home Page (unchanged UI portions omitted for brevity)
  const HomePage = () => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e6f0fa 0%, #fff 50%, #e0f7fa 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '50px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '120px', height: '120px', backgroundColor: '#3498db', borderRadius: '50%',
            marginBottom: '30px', boxShadow: '0 8px 25px rgba(52, 152, 219, 0.3)'
          }}>
            <FileText size={60} color="#fff" />
          </div>
          <h1 style={{ fontSize: '3em', fontWeight: 'bold', color: '#2c3e50', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            PTIS Testing System
          </h1>
          <p style={{ fontSize: '1.2em', color: '#7f8c8d', marginTop: '10px' }}>
            Professional Testing & Certification Platform
          </p>
        </div>

        {loading && <div style={commonStyles.loading}><Loader size={24} />Loading...</div>}
        {error && <div style={commonStyles.error}><AlertCircle size={20} />{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={commonStyles.card}>
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#e6f0fa', borderRadius: '50%', marginBottom: '20px' }}>
                <User size={40} color="#3498db" />
              </div>
              <h2 style={{ color: '#2c3e50', margin: '0 0 10px', fontSize: '1.8em' }}>Employee Login</h2>
              <p style={{ color: '#7f8c8d', margin: 0 }}>Take your certification test</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Employee ID
                </label>
                <input
                ref={idInputRef}
                type="text"
                placeholder={employees.length === 0 ? 'Loading employees...' : 'Type Employee ID and press Enter'}
                value={selectedEmployee}
                onFocus={() => setIsTypingId(true)}
                onBlur={() => setIsTypingId(false)}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    fillEmployeeNameFromTypedId(e.currentTarget.value);
                  }
                }}
                autoComplete="off"
                style={{ ...commonStyles.input, backgroundColor: !dataLoaded ? '#f5f6f5' : '#fff' }}
                disabled={!dataLoaded}
              />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Employee Name
                </label>
                <input type="text" value={employeeName} readOnly style={{ ...commonStyles.input, backgroundColor: '#f5f6f5' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Test Standard
                </label>
                <select
                  value={selectedStandard}
                  onChange={(e) => handleStandardSelect(e.target.value)}
                  style={{ ...commonStyles.input, backgroundColor: !dataLoaded ? '#f5f6f5' : '#fff' }}
                  disabled={!dataLoaded}
                >
                  <option value="">{standards.length === 0 ? 'Loading standards...' : 'Select Standard'}</option>
                  {standards.map(std => (
                    <option key={std.Standard_List} value={std.Standard_List}>{std.Standard_List}</option>
                  ))}
                </select>
              </div>

              {testInfo && (
                <div style={{ backgroundColor: '#e6f0fa', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>Test Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '1.8em', color: '#3498db', fontWeight: 'bold' }}>{testInfo.Total_Questions}</div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>Questions</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.8em', color: '#27ae60', fontWeight: 'bold' }}>{testInfo.Passing_Criteria}</div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>Pass Mark</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4em', color: '#e67e22', fontWeight: 'bold' }}>
                      {testInfo.hours || 0}h {testInfo.minutes || 0}m {testInfo.seconds || 0}s
                    </div>
                    <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>Time Limit</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartTest}
                disabled={!selectedEmployee || !selectedStandard || loading}
                style={{
                  ...commonStyles.button,
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: (!selectedEmployee || !selectedStandard || loading) ? '#bdc3c7' : '#3498db',
                  cursor: (!selectedEmployee || !selectedStandard || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                <LogIn size={20} />
                {loading ? 'Loading...' : 'Start Test'}
              </button>
            </div>
          </div>

        <div style={commonStyles.card}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#e8f5e8', borderRadius: '50%', marginBottom: '20px' }}>
              <Shield size={40} color="#27ae60" />
            </div>
            <h2 style={{ color: '#2c3e50', margin: '0 0 10px', fontSize: '1.8em' }}>Admin Panel</h2>
            <p style={{ color: '#7f8c8d', margin: 0 }}>Manage tests and view results</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdminLogin();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}
          >
            <div>
              <label
                htmlFor="admin-password"
                style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}
              >
                Admin Password
              </label>
              <input
                id="admin-password"
                name="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                style={commonStyles.input}
              />
            </div>

            <button
              type="submit"
              style={{
                ...commonStyles.button,
                width: '100%',
                justifyContent: 'center',
                backgroundColor: '#27ae60'
              }}
            >
              <Settings size={20} />
              Admin Login
            </button>
          </form>
        </div>

        </div>
      </div>
    </div>
  );

  const TestPage = () => {
    if (!questions.length || !testInfo) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f6f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    const canSubmit = isLastQuestion && selectedAnswer && remainingSkipped === 1;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f6f5' }}>
        <div style={{ backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderBottom: '1px solid #eee' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                PTIS Test
              </h1>
              <span style={{ backgroundColor: '#e6f0fa', color: '#3498db', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9em', fontWeight: 'bold' }}>
                {selectedStandard}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e67e22' }}>
                <Clock size={20} />
                <span style={{ fontFamily: 'monospace', fontSize: '1.2em', fontWeight: 'bold' }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <span style={{ backgroundColor: '#ecf0f1', color: '#7f8c8d', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9em' }}>
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
            <div style={{ backgroundColor: '#fef5e7', border: '1px solid #f9e79f', borderRadius: '8px', padding: '15px', marginBottom: '25px', textAlign: 'center' }}>
              <AlertCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#7d6608' }} />
              <span style={{ color: '#7d6608', fontWeight: 'bold' }}>
                {skipped.length} question(s) skipped. You must answer all questions to submit the test.
              </span>
            </div>
          )}

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '30px', marginBottom: '25px' }}>
            {question ? (
              <>
                <h2 style={{ fontSize: '1.4em', fontWeight: '600', marginBottom: '25px', color: '#2c3e50', lineHeight: '1.4' }}>
                  {wasSkipped && !isReviewingSkipped && (
                    <span style={{ color: '#e67e22', fontSize: '0.8em', marginRight: '10px' }}>⏭ SKIPPED</span>
                  )}
                  <span style={{ color: '#3498db', fontWeight: 'bold' }}>Q{currentQuestion + 1}.</span> {question.Question}
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
                          border: `2px solid ${isSelected ? '#3498db' : '#ecf0f1'}`,
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#e6f0fa' : '#fff',
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
                          backgroundColor: isSelected ? '#3498db' : '#ecf0f1',
                          color: isSelected ? '#fff' : '#7f8c8d',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {letter}
                        </span>
                        <span style={{ color: '#2c3e50', fontSize: '1em', lineHeight: '1.4' }}>
                          {question[opt]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ color: '#7f8c8d' }}>No question available.</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <button
              onClick={handleSkipQuestion}
              disabled={isReviewingSkipped}
              style={{
                padding: '12px 20px',
                border: '2px solid #bdc3c7',
                color: isReviewingSkipped ? '#bdc3c7' : '#7f8c8d',
                borderRadius: '8px',
                backgroundColor: '#fff',
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
                  backgroundColor: selectedAnswer ? '#3498db' : '#bdc3c7',
                  cursor: selectedAnswer ? 'pointer' : 'not-allowed'
                }}
              >
                Next →
              </button>

              {isLastQuestion && selectedAnswer && (
                <button
                  onClick={handleNextQuestion}
                  style={{
                    ...commonStyles.button,
                    backgroundColor: '#27ae60'
                  }}
                >
                  Submit Test
                </button>
              )}
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f6f5 0%, #e6f0fa 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '15px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            padding: '40px',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              {testResult.STATUS === 'PASS' ? (
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
                  <p style={{ fontSize: '1.2em', color: '#7f8c8d', margin: 0 }}>
                    You have successfully passed the test
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={80} color="#e74c3c" style={{ marginBottom: '20px' }} />
                  <h1 style={{
                    fontSize: '2.5em',
                    fontWeight: 'bold',
                    color: '#e74c3c',
                    margin: '0 0 10px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Test Not Passed
                  </h1>
                  <p style={{ fontSize: '1.2em', color: '#7f8c8d', margin: 0 }}>
                    Please review and try again
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
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '25px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <User size={24} color="#3498db" />
                  Employee Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Employee ID:</span>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1em' }}>
                      {testResult.ID}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Name:</span>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1em' }}>
                      {testResult.NAME}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Test Standard:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: '#3498db',
                      backgroundColor: '#e6f0fa',
                      padding: '6px 12px',
                      borderRadius: '15px',
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
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Test Date:</span>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1em' }}>
                      {testResult.DATE}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: testResult.STATUS === 'PASS' ? '#e8f5e8' : '#ffebee',
                borderRadius: '12px',
                padding: '25px',
                border: `2px solid ${testResult.STATUS === 'PASS' ? '#c8e6c9' : '#ffcdd2'}`
              }}>
                <h3 style={{
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <BarChart3 size={24} color="#9b59b6" />
                  Test Results
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Total Questions:</span>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.2em' }}>
                      {testResult.TOTAL_QUESTION}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Correct Answers:</span>
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
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Wrong Answers:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: '#e74c3c',
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
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Final Score:</span>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1em' }}>
                      {testResult.FINAL_SCORE} / {testResult.TOTAL_QUESTION}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 0',
                    borderTop: '2px solid #dee2e6',
                    marginTop: '10px'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '600', fontSize: '1.1em' }}>
                      Percentage Score:
                    </span>
                    <span style={{
                      fontSize: '2.2em',
                      fontWeight: 'bold',
                      color: testResult.STATUS === 'PASS' ? '#27ae60' : '#e74c3c',
                      textShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {testResult.PERCENTAGE}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.9em',
                    color: '#7f8c8d',
                    textAlign: 'center',
                    marginTop: '15px',
                    fontStyle: 'italic'
                  }}>
                    Pass Mark: {testResult.PASSING_CRITERIA} | 
                    Negative marking: -0.25 per wrong answer
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
                  boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
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

  // ---------- Admin Page (EMPLOYEE FILTERS FROM RESULTS ONLY) ----------
  const AdminPage = () => {
    const norm = (v) => (v ?? '').toString().trim();
    const normLower = (v) => norm(v).toLowerCase();
    const isPass = (status) => normLower(status) === 'pass';
    const toPctNumber = (p) => {
      const n = parseFloat((p ?? '').toString().replace('%', ''));
      return Number.isFinite(n) ? n : 0;
    };

    // Build employee pairs exclusively from results (unique by ID)
    const employeePairs = useMemo(() => {
      // Map<ID, NAME> using first seen name for that ID
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
      // Sort by numeric ID if possible
      return Array.from(idToName.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));
    }, [results]);

    // Maps for interconnection
    const employeeIdToName = useMemo(() => {
      const m = new Map(employeePairs);
      return m;
    }, [employeePairs]);

    const employeeNameToId = useMemo(() => {
      const m = new Map();
      // if multiple IDs share same name, the first one wins
      employeePairs.forEach(([id, name]) => {
        if (name && !m.has(name)) m.set(name, id);
      });
      return m;
    }, [employeePairs]);

    // Options that come ONLY from results
    const employeeIdOptions = useMemo(() => employeePairs.map(([id]) => id), [employeePairs]);
    const employeeNameOptions = useMemo(() => {
      const s = new Set(employeePairs.map(([, name]) => name).filter(Boolean));
      return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [employeePairs]);

    // Standards list from results
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

    // Stats from filtered results
    const totalTests = filteredResults.length;
    const passedTests = filteredResults.filter(r => isPass(r.STATUS)).length;
    const failedTests = totalTests - passedTests;
    const averageScore = totalTests > 0
      ? filteredResults.reduce((sum, r) => sum + toPctNumber(r.PERCENTAGE), 0) / totalTests
      : 0;

    // CSV export (filtered)
    const exportCsv = (rows) => {
      const headers = ['S.No.', 'Employee ID', 'Name', 'Standard', 'Total', 'Correct', 'Wrong', 'Score', 'Pass Criteria', 'Status', 'Date'];
      const data = rows.map((r, i) => [
        i + 1, norm(r.ID), norm(r.NAME), norm(r.STANDARD),
        norm(r.TOTAL_QUESTION), norm(r.CORRECT_ANSWER), norm(r.WRONG_ANSWER),
        `${toPctNumber(r.PERCENTAGE)}%`, norm(r.PASSING_CRITERIA), norm(r.STATUS), norm(r.DATE)
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
      a.href = url; a.download = `ptis-test-results-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    };

    useEffect(() => {
      if (isAdmin && currentPage === 'admin' && results.length === 0) {
        console.log('Loading results for admin dashboard');
        loadResults(true);
      }
    }, [isAdmin, currentPage]);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f6f5' }}>
        <div style={{ backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderBottom: '1px solid #eee' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Shield size={32} color="#27ae60" />
              <h1 style={{ fontSize: '2em', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>Admin Dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => loadResults(true)} style={{ ...commonStyles.button, backgroundColor: '#fff', color: '#3498db', border: '2px solid #3498db' }}>
                {adminLoading ? <><Loader size={16} /> Refreshing...</> : <><RefreshCw size={16} /> Refresh Data</>}
              </button>
              <button
                onClick={() => {
                  console.log('Logout button clicked');
                  setIsAdmin(false);
                  setCurrentPage('home');
                }}
                style={{ ...commonStyles.button, backgroundColor: '#fff', color: '#7f8c8d', border: '2px solid #ddd' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '25px 20px' }}>
          {error && (
            <div style={commonStyles.error}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* FILTER BAR (Employees from results only) */}
          <div style={{ ...commonStyles.card, marginBottom: 20, textAlign: 'left' }}>
            <h3 style={{ marginTop: 0, marginBottom: 15, color: '#2c3e50' }}>Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#2c3e50' }}>Employee ID</label>
                <select
                  value={filterEmpId}
                  onChange={e => onChangeEmpId(e.target.value)}
                  style={commonStyles.input}
                >
                  <option value="">All</option>
                  {employeeIdOptions.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#2c3e50' }}>Employee Name</label>
                <select
                  value={filterEmpName}
                  onChange={e => onChangeEmpName(e.target.value)}
                  style={commonStyles.input}
                >
                  <option value="">All</option>
                  {employeeNameOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#2c3e50' }}>Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={commonStyles.input}
                >
                  {['All', 'PASS', 'FAIL'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#2c3e50' }}>Standard</label>
                <select
                  value={filterStandard}
                  onChange={e => setFilterStandard(e.target.value)}
                  style={commonStyles.input}
                >
                  {standardOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <button onClick={() => exportCsv(filteredResults)} style={{ ...commonStyles.button, backgroundColor: '#2ecc71' }}>
                <Download size={16} /> Export CSV (Filtered)
              </button>
              <button onClick={clearFilters} style={{ ...commonStyles.button, backgroundColor: '#fff', color: '#7f8c8d', border: '2px solid #ddd' }}>
                Clear Filters
              </button>
            </div>
          </div>

          {/* KPI Cards (Filtered) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={commonStyles.card}>
              <Users size={48} color="#3498db" style={{ marginBottom: '15px' }} />
              <h3 style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>Total Tests</h3>
              <p style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#3498db', margin: 0 }}>{totalTests}</p>
            </div>
            <div style={commonStyles.card}>
              <CheckCircle size={48} color="#27ae60" style={{ marginBottom: '15px' }} />
              <h3 style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>Passed</h3>
              <p style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#27ae60', margin: 0 }}>{passedTests}</p>
            </div>
            <div style={commonStyles.card}>
              <XCircle size={48} color="#e74c3c" style={{ marginBottom: '15px' }} />
              <h3 style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>Failed</h3>
              <p style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#e74c3c', margin: 0 }}>{failedTests}</p>
            </div>
            <div style={commonStyles.card}>
              <BarChart3 size={48} color="#9b59b6" style={{ marginBottom: '15px' }} />
              <h3 style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>Avg Score</h3>
              <p style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#9b59b6', margin: 0 }}>{averageScore.toFixed(1)}%</p>
            </div>
          </div>

          {/* Results Table */}
          <div style={commonStyles.card}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>Test Results</h2>
              <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
                Showing {filteredResults.length} record(s)
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {adminLoading ? (
                <div style={commonStyles.loading}>
                  <Loader size={24} /> Loading results...
                </div>
              ) : filteredResults.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <AlertCircle size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
                  <p style={{ color: '#7f8c8d', fontSize: '1.1em', margin: 0 }}>
                    No test results match your filters.
                  </p>
                </div>
              ) : (
                <table style={commonStyles.table}>
                  <thead style={{ backgroundColor: '#f5f6f5' }}>
                    <tr>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result, index) => (
                      <tr key={`${result.ID}-${result.STANDARD}-${result.DATE}-${index}`}>
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
                          color: isPass(result.STATUS) ? '#27ae60' : '#e74c3c',
                          fontWeight: 'bold'
                        }}>
                          {norm(result.STATUS)}
                        </td>
                        <td style={commonStyles.td}>{norm(result.DATE)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'test' && <TestPage />}
      {currentPage === 'result' && <ResultPage />}
      {currentPage === 'admin' && <AdminPage />}
    </>
  );
};

export default TestingModule;
