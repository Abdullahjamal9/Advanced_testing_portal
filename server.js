const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AJptis-3692',
  database: process.env.DB_NAME || 'ptis_testing'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    console.error('Make sure MySQL is running and credentials are correct');
    return;
  }
  console.log('✅ Connected to MySQL Database');
});

// Handle database disconnection
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting to database...');
    db.connect();
  }
});

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'PTIS API is running!', 
    endpoints: [
      'GET /api/employees',
      'GET /api/standards', 
      'GET /api/questions',
      'GET /api/info',
      'GET /api/results',
      'POST /api/results',
      'GET /api/health',
      'GET /api/debug/standards'
    ]
  });
});

// Get all employees
app.get('/api/employees', (req, res) => {
  console.log('Fetching employees...');
  db.query('SELECT ID, NAME as Name FROM employees ORDER BY NAME', (err, results) => {
    if (err) {
      console.error('Database error (employees):', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }
    console.log(`Found ${results.length} employees`, results.slice(0, 2));
    res.json(results);
  });
});

// Get all standards
app.get('/api/standards', (req, res) => {
  console.log('Fetching standards...');
  db.query('SELECT Standard_List, Short_Name FROM standard ORDER BY Standard_List', (err, results) => {
    if (err) {
      console.error('Database error (standards):', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }
    console.log(`Found ${results.length} standards`, results.slice(0, 2));
    res.json(results);
  });
});

// Get questions (optionally filtered by standard)
app.get('/api/questions', (req, res) => {
  const { standard } = req.query;
  console.log('Fetching questions for standard:', standard);
  
  db.query('DESCRIBE questions', (err, columns) => {
    if (err) {
      console.error('Error describing questions table:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }
    
    console.log('Questions table columns:', columns.map(col => col.Field));
    
    const possibleIdColumns = ['NO', 'ID', 'Question_ID', 'Number', 'Num', 'Sr_No'];
    const possibleStandardColumns = ['Standard', 'Standard_List', 'Category'];
    
    const columnNames = columns.map(col => col.Field);
    const idColumn = possibleIdColumns.find(col => columnNames.includes(col)) || columnNames[0];
    const standardColumn = possibleStandardColumns.find(col => columnNames.includes(col)) || 'Standard';
    
    let query, params;
    
    if (standard === 'Cumulative') {
      query = `SELECT ${idColumn} as NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} as Standard FROM questions ORDER BY RAND()`;
      params = [];
      console.log('Fetching ALL questions for Cumulative test');
    } else if (standard) {
      query = `SELECT ${idColumn} as NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} as Standard FROM questions WHERE ${standardColumn} LIKE ? ORDER BY ${idColumn}`;
      params = [`%${standard}%`];
      console.log('Using LIKE search for standard:', standard);
      
      const exactQuery = `SELECT ${idColumn} as NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} as Standard FROM questions WHERE ${standardColumn} = ? ORDER BY ${idColumn}`;
      
      db.query(exactQuery, [standard], (exactErr, exactResults) => {
        if (!exactErr && exactResults.length > 0) {
          console.log(`Found ${exactResults.length} questions with exact match`, exactResults.slice(0, 2));
          return res.json(exactResults);
        }
        
        console.log('Exact match failed, trying LIKE query...');
        db.query(query, params, (err, results) => {
          if (err) {
            console.error('Database error (questions):', err);
            return res.status(500).json({ 
              error: 'Database error', 
              details: err.message 
            });
          }
          console.log(`Found ${results.length} questions with LIKE search`, results.slice(0, 2));
          res.json(results);
        });
      });
      return;
    } else {
      query = `SELECT ${idColumn} as NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} as Standard FROM questions ORDER BY ${idColumn}`;
      params = [];
    }
    
    console.log('Executing questions query:', query, params);
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error('Database error (questions):', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }
      console.log(`Found ${results.length} questions`, results.slice(0, 2));
      res.json(results);
    });
  });
});

// Get test info for a specific standard
app.get('/api/info', (req, res) => {
  const { standard } = req.query;
  
  if (!standard) {
    return res.status(400).json({ error: 'Standard parameter required' });
  }
  
  console.log('Fetching test info for standard:', standard);
  
  if (standard === 'Cumulative') {
    console.log('Returning default info for Cumulative test');
    return res.json({
      Total_Questions: 50,
      Passing_Criteria: 70,
      hours: 1,
      minutes: 30,
      seconds: 0
    });
  }
  
  db.query(
    'SELECT Total_Questions, Passing_Criteria, Hours, Minutes, Seconds FROM info WHERE Standard_List = ?',
    [standard],
    (err, results) => {
      if (err) {
        console.error('Database error (info):', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }
      
      if (results.length > 0) {
        const info = results[0];
        console.log('Found test info:', info);
        return res.json({
          Total_Questions: info.Total_Questions,
          Passing_Criteria: info.Passing_Criteria,
          hours: info.Hours || 0,
          minutes: info.Minutes || 0,
          seconds: info.Seconds || 0
        });
      }
      
      console.log('Exact match failed for info, trying LIKE search...');
      db.query(
        'SELECT Total_Questions, Passing_Criteria, Hours, Minutes, Seconds FROM info WHERE Standard_List LIKE ?',
        [`%${standard}%`],
        (likeErr, likeResults) => {
          if (likeErr) {
            console.error('Database error (info LIKE):', likeErr);
            return res.status(500).json({ 
              error: 'Database error', 
              details: likeErr.message 
            });
          }
          
          if (likeResults.length === 0) {
            console.log('No info found for standard, returning defaults');
            return res.json({
              Total_Questions: 20,
              Passing_Criteria: 70,
              hours: 0,
              minutes: 30,
              seconds: 0
            });
          }
          
          const info = likeResults[0];
          console.log('Found test info with LIKE:', info);
          res.json({
            Total_Questions: info.Total_Questions,
            Passing_Criteria: info.Passing_Criteria,
            hours: info.Hours || 0,
            minutes: info.Minutes || 0,
            seconds: info.Seconds || 0
          });
        }
      );
    }
  );
});

// Get all test results (NO FINAL_SCORE in select; STANDARD as-is)
app.get('/api/results', (req, res) => {
  console.log('Fetching test results...');
  db.query(
    'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result ORDER BY DATE DESC, ID',
    (err, results) => {
      if (err) {
        console.error('Database error (results):', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }
      console.log(`Found ${results.length} test results`, results.slice(0, 2));
      res.json(results);
    }
  );
});

// Save a test result (expects STANDARD, not Standard_List)
app.post('/api/results', (req, res) => {
  const { 
    ID, 
    NAME, 
    TOTAL_QUESTION, 
    CORRECT_ANSWER, 
    WRONG_ANSWER, 
    PERCENTAGE, 
    PASSING_CRITERIA, 
    STATUS, 
    STANDARD, 
    DATE
  } = req.body;
  
  console.log('Saving test result');
  console.log('Received payload:', req.body);
  
  // Validate required fields (STANDARD required here)
  if (!ID || !NAME || !TOTAL_QUESTION || !STANDARD || !DATE) {
    console.error('Missing required fields:', { ID, NAME, TOTAL_QUESTION, STANDARD, DATE });
    return res.status(400).json({ 
      error: 'Missing required fields', 
      required: ['ID', 'NAME', 'TOTAL_QUESTION', 'STANDARD', 'DATE'],
      received: { ID, NAME, TOTAL_QUESTION, STANDARD, DATE }
    });
  }

  // Coerce numeric-ish values safely (optional but nice)
  const pct =
  PERCENTAGE == null
    ? null
    : (String(PERCENTAGE).includes('%')
        ? String(PERCENTAGE)
        : `${Number(PERCENTAGE).toFixed(2)}%`);

  const passStr =
    PASSING_CRITERIA == null
      ? null
      : (String(PASSING_CRITERIA).includes('%')
          ? String(PASSING_CRITERIA)
          : `${Number(PASSING_CRITERIA).toFixed(0)}%`);

  // Check for existing result
  db.query(
    'SELECT ID FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
    [ID, STANDARD, DATE],
    (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Database error (check duplicate):', checkErr);
        return res.status(500).json({ 
          error: 'Database error checking for duplicates', 
          details: checkErr.message 
        });
      }
      
      if (checkResults.length > 0) {
        // Update existing result
        const sql = 'UPDATE result SET NAME = ?, TOTAL_QUESTION = ?, CORRECT_ANSWER = ?, WRONG_ANSWER = ?, PERCENTAGE = ?, PASSING_CRITERIA = ?, STATUS = ? WHERE ID = ? AND STANDARD = ? AND DATE = ?';
        const params = [NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, pct, passStr, STATUS, ID, STANDARD, DATE];
        console.log('Running UPDATE with params:', params);
        db.query(sql, params, (updateErr) => {
          if (updateErr) {
            console.error('Database error (update result):', updateErr);
            return res.status(500).json({ 
              error: 'Database error updating result', 
              details: updateErr.message 
            });
          }
          // Fetch the updated row
          db.query(
            'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
            [ID, STANDARD, DATE],
            (fetchErr, fetchResults) => {
              if (fetchErr) {
                console.error('Database error (fetch updated result):', fetchErr);
                return res.status(500).json({ 
                  error: 'Database error fetching updated result', 
                  details: fetchErr.message 
                });
              }
              console.log('Updated result:', fetchResults[0]);
              res.json({ 
                success: true, 
                message: 'Test result updated successfully',
                data: fetchResults[0]
              });
            }
          );
        });
      } else {
        // Insert new result
        const sql = 'INSERT INTO result (ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, pct, passStr, STATUS, STANDARD, DATE];
        console.log('Running INSERT with params:', params);
        db.query(sql, params, (err, results) => {
          if (err) {
            console.error('Database error (save result):', err);
            return res.status(500).json({ 
              error: 'Database error', 
              details: err.message 
            });
          }
          console.log('Inserted result insertId:', results.insertId);
          // Fetch the saved row (by PK triple)
          db.query(
            'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
            [ID, STANDARD, DATE],
            (fetchErr, fetchResults) => {
              if (fetchErr) {
                console.error('Database error (fetch saved result):', fetchErr);
                return res.status(500).json({ 
                  error: 'Database error fetching saved result', 
                  details: fetchErr.message 
                });
              }
              console.log('Fetched saved result:', fetchResults[0]);
              res.json({ 
                success: true,
                id: results.insertId,
                message: 'Test result saved successfully',
                data: fetchResults[0]
              });
            }
          );
        });
      }
    }
  );
});

// Debug endpoint to check standards in database
app.get('/api/debug/standards', (req, res) => {
  console.log('Debug: Checking all standards in database');
  db.query('SELECT DISTINCT Standard_List FROM standard', (err, results) => {
    if (err) {
      console.error('Database error (debug standards):', err);
      return res.status(500).json({ error: err.message });
    }
    
    db.query('SELECT DISTINCT Standard_List FROM info', (infoErr, infoResults) => {
      if (infoErr) {
        console.error('Database error (debug info):', infoErr);
        return res.status(500).json({ error: infoErr.message });
      }
      
      db.query('DESCRIBE questions', (descErr, columns) => {
        if (descErr) {
          console.error('Database error (describe questions):', descErr);
          return res.status(500).json({ error: descErr.message });
        }
        
        const columnNames = columns.map(col => col.Field);
        const possibleStandardColumns = ['Standard', 'Standard_List', 'Category'];
        const standardColumn = possibleStandardColumns.find(col => columnNames.includes(col)) || 'Standard';
        
        db.query(`SELECT DISTINCT ${standardColumn} as Standard FROM questions`, (qErr, qResults) => {
          if (qErr) {
            console.error('Database error (debug questions):', qErr);
            return res.status(500).json({ error: qErr.message });
          }
          
          res.json({
            standards_table: results,
            info_table: infoResults,
            questions_table: qResults,
            questions_column_used: standardColumn
          });
        });
      });
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Database health check failed:', err);
      return res.status(500).json({ 
        status: 'error', 
        database: 'disconnected',
        error: err.message 
      });
    }
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀 PTIS Server Details:');
  console.log(`   • Server running on: http://localhost:${PORT}`);
  console.log(`   • Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   • Database: ${process.env.DB_NAME || 'ptis_testing'}`);
  console.log('   • Available endpoints:');
  console.log('     - GET  /api/employees');
  console.log('     - GET  /api/standards');
  console.log('     - GET  /api/questions');
  console.log('     - GET  /api/info');
  console.log('     - GET  /api/results');
  console.log('     - POST /api/results');
  console.log('     - GET  /api/health');
  console.log('     - GET  /api/debug/standards');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  db.end(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
});
