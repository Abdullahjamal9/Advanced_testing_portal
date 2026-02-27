// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

/* -------------------------- Middleware -------------------------- */
app.use(express.json({ limit: '50mb' })); // Increased limit for Excel uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL // Add your deployed frontend URL here
  ].filter(Boolean),
  credentials: true
}));

/* -------------------- DB connections (mysql2) ------------------- */
// Callback connection (for existing code)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AJptis-3692',
  database: process.env.DB_NAME || 'ptis_testing'
});

// Promise pool (used in employees CRUD)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AJptis-3692',
  database: process.env.DB_NAME || 'ptis_testing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

db.connect((err) => {
  if (err) {
    console.error('Error Connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL Database');
});

db.on('error', (err) => {
  console.error('Database Error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting To Database...');
    db.connect();
  }
});

/* ---------------------- Request logger -------------------------- */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* -------------------------- Root route -------------------------- */
app.get('/', (req, res) => {
  res.json({
    message: 'PTIS API is Running!',
    hint: 'Visit /api/_routes to see all mounted routes.'
  });
});

/* ------------------- Certificate Templates List ----------------- */
app.get('/api/certificate-templates', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../certificates/templates');
    const files = fs.readdirSync(templatesDir);
    
    // Get PDF template names without extension
    const templates = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => file.replace('.pdf', ''))
      .sort();
    
    res.json(templates);
  } catch (error) {
    console.error('Error reading templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

/* ---------------------- Employees CRUD (NEW) -------------------- */
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT ID, Name FROM employees ORDER BY CAST(ID AS UNSIGNED), ID'
    );
    res.json(rows);
  } catch (e) {
    console.error('Employees List Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { ID, Name } = req.body || {};
  if (!ID || !Name) return res.status(400).json({ error: 'ID and Name are Required' });

  try {
    await pool.query(
      `INSERT INTO employees (ID, Name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE Name = VALUES(Name)`,
      [ID, Name]
    );
    res.json({ ok: true, ID, Name });
  } catch (e) {
    console.error('Employees Upsert Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { Name } = req.body || {};
  if (!Name) return res.status(400).json({ error: 'Name is Required' });

  try {
    const [r] = await pool.query('UPDATE employees SET Name=? WHERE ID=?', [Name, id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Employee Not Found' });
    res.json({ ok: true, ID: id, Name });
  } catch (e) {
    console.error('Employees Update Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await pool.query('DELETE FROM employees WHERE ID=?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Employee Not Found' });
    res.json({ ok: true, ID: id });
  } catch (e) {
    console.error('Employees Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* ---------------------------- Standards ------------------------- */
app.get('/api/standards', (req, res) => {
  db.query(
    'SELECT Standard_List, Short_Name, Negative_Marking, Certificate_Template FROM standard ORDER BY Standard_List',
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database Error', details: err.message });
      res.json(results);
    }
  );
});

/* ---------------------------- Questions ------------------------- */
app.get('/api/questions', (req, res) => {
  const { standard } = req.query;

  db.query('DESCRIBE questions', (err, columns) => {
    if (err) return res.status(500).json({ error: 'Database Error', details: err.message });

    const possibleIdColumns = ['NO', 'ID', 'Question_ID', 'Number', 'Num', 'Sr_No'];
    const possibleStandardColumns = ['Standard', 'Standard_List', 'Category'];

    const columnNames = columns.map(col => col.Field);
    const idColumn = possibleIdColumns.find(col => columnNames.includes(col)) || columnNames[0];
    const standardColumn = possibleStandardColumns.find(col => columnNames.includes(col)) || 'Standard';

    if (standard === 'Cumulative') {
      const q = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} AS Standard
                 FROM questions ORDER BY RAND()`;
      return db.query(q, [], (qErr, rows) => {
        if (qErr) return res.status(500).json({ error: 'Database Error', details: qErr.message });
        res.json(rows);
      });
    }

    if (standard) {
      const exact = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} AS Standard
                     FROM questions WHERE ${standardColumn} = ? ORDER BY ${idColumn}`;
      return db.query(exact, [standard], (e1, r1) => {
        if (!e1 && r1.length) return res.json(r1);
        const like = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} AS Standard
                      FROM questions WHERE ${standardColumn} LIKE ? ORDER BY ${idColumn}`;
        db.query(like, [`%${standard}%`], (e2, r2) => {
          if (e2) return res.status(500).json({ error: 'Database Error', details: e2.message });
          res.json(r2);
        });
      });
    }

    const all = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, ${standardColumn} AS Standard
                 FROM questions ORDER BY ${idColumn}`;
    db.query(all, [], (e3, r3) => {
      if (e3) return res.status(500).json({ error: 'Database Error', details: e3.message });
      res.json(r3);
    });
  });
});

// Add Question
app.post('/api/questions', async (req, res) => {
  const { Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List } = req.body || {};
  if (!Question || !Opt_A || !Opt_B || !Opt_C || !Opt_D || !Answer || !Standard_List) {
    return res.status(400).json({ error: 'All Fields Are Required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO questions (Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List]
    );
    res.json({ ok: true, NO: result.insertId });
  } catch (e) {
    console.error('Questions Insert Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Bulk Insert Questions from Excel
app.post('/api/questions/bulk', async (req, res) => {
  console.log('📥 Bulk upload request received');
  console.log('Request body type:', typeof req.body);
  console.log('Questions array length:', req.body?.questions?.length);
  
  const { questions } = req.body || {};
  
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    console.log('❌ Invalid request: questions array missing or empty');
    return res.status(400).json({ error: 'Questions array is required' });
  }

  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  console.log(`🔄 Processing ${questions.length} questions...`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const rowNum = i + 1;

    // Validate required fields
    if (!q.Question || !q.Opt_A || !q.Opt_B || !q.Opt_C || !q.Opt_D || !q.Answer || !q.Standard_List) {
      failedCount++;
      errors.push({
        row: rowNum,
        error: 'Missing required fields',
        question: q.Question || 'N/A'
      });
      continue;
    }

    // Validate answer is one of A, B, C, D
    const answer = q.Answer.toString().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      failedCount++;
      errors.push({
        row: rowNum,
        error: 'Answer must be A, B, C, or D',
        question: q.Question
      });
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO questions (Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [q.Question, q.Opt_A, q.Opt_B, q.Opt_C, q.Opt_D, answer, q.Standard_List]
      );
      successCount++;
    } catch (e) {
      failedCount++;
      errors.push({
        row: rowNum,
        error: e.message,
        question: q.Question
      });
      console.error(`Bulk Insert Error (Row ${rowNum}):`, e);
    }
  }

  console.log(`✅ Bulk upload complete: ${successCount} success, ${failedCount} failed`);

  res.json({
    success: successCount,
    failed: failedCount,
    total: questions.length,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Update Question
app.put('/api/questions/:no', async (req, res) => {
  const { no } = req.params;
  const { Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List } = req.body || {};
  
  try {
    const [result] = await pool.query(
      `UPDATE questions 
       SET Question = ?, Opt_A = ?, Opt_B = ?, Opt_C = ?, Opt_D = ?, Answer = ?, Standard_List = ?
       WHERE NO = ?`,
      [Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List, no]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question Not Found' });
    }
    
    res.json({ ok: true, NO: no });
  } catch (e) {
    console.error('Questions Update Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Delete Question
app.delete('/api/questions/:no', async (req, res) => {
  const { no } = req.params;
  
  try {
    const [result] = await pool.query('DELETE FROM questions WHERE NO = ?', [no]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question Not Found' });
    }
    
    res.json({ ok: true, NO: no });
  } catch (e) {
    console.error('Questions Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* ------------------------------ Info ---------------------------- */
app.get('/api/info', (req, res) => {
  const { standard } = req.query;
  
  // If no standard parameter, return all info records
  if (!standard) {
    db.query(
      'SELECT Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds FROM info ORDER BY Standard_List',
      (err, results) => {
        if (err) return res.status(500).json({ error: 'Database Error', details: err.message });
        res.json(results);
      }
    );
    return;
  }

  // Query database for the standard (including 'Cumulative')
  db.query(
    'SELECT Total_Questions, Passing_Criteria, Hours, Minutes, Seconds FROM info WHERE Standard_List = ?',
    [standard],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database Error', details: err.message });
      if (results.length) {
        const info = results[0];
        // Parse Passing_Criteria - remove % sign if present and convert to number
        let passingCriteria = info.Passing_Criteria;
        console.log('🔍 DEBUG Cumulative Info:', { original: info.Passing_Criteria, type: typeof info.Passing_Criteria });
        if (typeof passingCriteria === 'string') {
          passingCriteria = parseInt(passingCriteria.replace('%', ''));
        }
        console.log('🔍 After Parsing:', passingCriteria);
        return res.json({
          Total_Questions: info.Total_Questions,
          Passing_Criteria: passingCriteria,
          hours: info.Hours || 0,
          minutes: info.Minutes || 0,
          seconds: info.Seconds || 0
        });
      }
      // Try LIKE search if exact match not found
      db.query(
        'SELECT Total_Questions, Passing_Criteria, Hours, Minutes, Seconds FROM info WHERE Standard_List LIKE ?',
        [`%${standard}%`],
        (e2, r2) => {
          if (e2) return res.status(500).json({ error: 'Database Error', details: e2.message });
          if (!r2.length) return res.json({ Total_Questions: 20, Passing_Criteria: 70, hours: 0, minutes: 30, seconds: 0 });
          const info = r2[0];
          // Parse Passing_Criteria - remove % sign if present and convert to number
          let passingCriteria = info.Passing_Criteria;
          if (typeof passingCriteria === 'string') {
            passingCriteria = parseInt(passingCriteria.replace('%', ''));
          }
          res.json({
            Total_Questions: info.Total_Questions,
            Passing_Criteria: passingCriteria,
            hours: info.Hours || 0,
            minutes: info.Minutes || 0,
            seconds: info.Seconds || 0
          });
        }
      );
    }
  );
});

// Add/Update Standard
app.post('/api/standards', async (req, res) => {
  const { Standard_List, Short_Name, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds, Negative_Marking, Certificate_Template } = req.body || {};
  if (!Standard_List) return res.status(400).json({ error: 'Standard_List is required' });

  try {
    // Insert/Update standard
    await pool.query(
      `INSERT INTO standard (Standard_List, Short_Name, Negative_Marking, Certificate_Template) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE Short_Name = VALUES(Short_Name), Negative_Marking = VALUES(Negative_Marking), Certificate_Template = VALUES(Certificate_Template)`,
      [Standard_List, Short_Name || '', Negative_Marking || 'Yes', Certificate_Template || '']
    );

    // Insert/Update info if additional fields provided
    if (Total_Questions || Passing_Criteria) {
      await pool.query(
        `INSERT INTO info (Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         Total_Questions = VALUES(Total_Questions),
         Passing_Criteria = VALUES(Passing_Criteria),
         Hours = VALUES(Hours),
         Minutes = VALUES(Minutes),
         Seconds = VALUES(Seconds)`,
        [
          Standard_List,
          Total_Questions || 20,
          Passing_Criteria || 70,
          Hours || 0,
          Minutes || 30,
          Seconds || 0
        ]
      );
    }

    res.json({ ok: true, Standard_List });
  } catch (e) {
    console.error('Standards Upsert Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Update Standard
app.put('/api/standards/:standard', async (req, res) => {
  const { standard } = req.params;
  const { Standard_List, Short_Name, Negative_Marking, Certificate_Template } = req.body || {};
  
  try {
    const [result] = await pool.query(
      'UPDATE standard SET Standard_List = ?, Short_Name = ?, Negative_Marking = ?, Certificate_Template = ? WHERE Standard_List = ?',
      [Standard_List || standard, Short_Name || '', Negative_Marking || 'Yes', Certificate_Template || '', standard]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Standard Not Found' });
    }
    
    res.json({ ok: true, Standard_List: Standard_List || standard });
  } catch (e) {
    console.error('Standards Update Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Delete Standard
app.delete('/api/standards/:standard', async (req, res) => {
  const { standard } = req.params;
  try {
    await pool.query('DELETE FROM standard WHERE Standard_List = ?', [standard]);
    res.json({ ok: true, Standard_List: standard });
  } catch (e) {
    console.error('Standards Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Update Info
app.put('/api/info/:standard', async (req, res) => {
  const { standard } = req.params;
  const { Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds } = req.body || {};
  
  try {
    const [result] = await pool.query(
      `UPDATE info 
       SET Standard_List = ?, Total_Questions = ?, Passing_Criteria = ?, Hours = ?, Minutes = ?, Seconds = ?
       WHERE Standard_List = ?`,
      [
        Standard_List || standard,
        Total_Questions || 20,
        Passing_Criteria || 70,
        Hours || 0,
        Minutes || 30,
        Seconds || 0,
        standard
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Info Not Found' });
    }
    
    res.json({ ok: true, Standard_List: Standard_List || standard });
  } catch (e) {
    console.error('Info Update Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Create Info
app.post('/api/info', async (req, res) => {
  const { Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds } = req.body || {};
  if (!Standard_List) return res.status(400).json({ error: 'Standard_List is required' });
  
  try {
    await pool.query(
      `INSERT INTO info (Standard_List, Total_Questions, Passing_Criteria, Hours, Minutes, Seconds) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       Total_Questions = VALUES(Total_Questions),
       Passing_Criteria = VALUES(Passing_Criteria),
       Hours = VALUES(Hours),
       Minutes = VALUES(Minutes),
       Seconds = VALUES(Seconds)`,
      [
        Standard_List,
        Total_Questions || 20,
        Passing_Criteria || 70,
        Hours || 0,
        Minutes || 30,
        Seconds || 0
      ]
    );
    
    res.json({ ok: true, Standard_List });
  } catch (e) {
    console.error('Info Insert Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Delete Info
app.delete('/api/info/:standard', async (req, res) => {
  const { standard } = req.params;
  try {
    await pool.query('DELETE FROM info WHERE Standard_List = ?', [standard]);
    res.json({ ok: true, Standard_List: standard });
  } catch (e) {
    console.error('Info Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* ----------------------------- Results -------------------------- */
app.get('/api/results', (req, res) => {
  db.query(
    'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result ORDER BY DATE DESC, ID',
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database Error', details: err.message });
      res.json(results);
    }
  );
});

app.post('/api/results', async (req, res) => {
  const {
    ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER,
    PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE, answers, questions,
    CERTIFICATION_TYPE
  } = req.body;

  // Debug logging
  console.log('📝 POST /api/results received:');
  console.log('  - ID:', ID);
  console.log('  - NAME:', NAME);
  console.log('  - STANDARD:', STANDARD);
  console.log('  - answers type:', typeof answers, 'length:', answers ? Object.keys(answers).length : 0);
  console.log('  - questions type:', typeof questions, 'length:', Array.isArray(questions) ? questions.length : 0);
  if (questions && Array.isArray(questions) && questions.length > 0) {
    console.log('  - Sample Question Fields:', Object.keys(questions[0]));
  }

  if (!ID || !NAME || !TOTAL_QUESTION || !STANDARD || !DATE) {
    return res.status(400).json({
      error: 'Missing Required Fields',
      required: ['ID', 'NAME', 'TOTAL_QUESTION', 'STANDARD', 'DATE']
    });
  }

  const pct =
    PERCENTAGE == null
      ? null
      : (String(PERCENTAGE).includes('%') ? String(PERCENTAGE) : `${Number(PERCENTAGE).toFixed(2)}%`);

  const passStr =
    PASSING_CRITERIA == null
      ? null
      : (String(PASSING_CRITERIA).includes('%') ? String(PASSING_CRITERIA) : `${Number(PASSING_CRITERIA).toFixed(0)}%`);

  // Store answers and questions as JSON
  const answersJSON = answers ? JSON.stringify(answers) : null;
  const questionsJSON = questions ? JSON.stringify(questions) : null;

  db.query(
    'SELECT ID FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
    [ID, STANDARD, DATE],
    (checkErr, checkResults) => {
      if (checkErr) return res.status(500).json({ error: 'Database Error Checking For Duplicates', details: checkErr.message });

      if (checkResults.length > 0) {
        const sql = `UPDATE result
                     SET NAME=?, TOTAL_QUESTION=?, CORRECT_ANSWER=?, WRONG_ANSWER=?, PERCENTAGE=?, PASSING_CRITERIA=?, STATUS=?, ANSWERS=?, QUESTIONS=?
                     WHERE ID=? AND STANDARD=? AND DATE=?`;
        const params = [NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, pct, passStr, STATUS, answersJSON, questionsJSON, ID, STANDARD, DATE];
        return db.query(sql, params, (updateErr) => {
          if (updateErr) return res.status(500).json({ error: 'Database Error Updating Result', details: updateErr.message });
          db.query(
            'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result WHERE ID=? AND STANDARD=? AND DATE=?',
            [ID, STANDARD, DATE],
            (fetchErr, fetchResults) => {
              if (fetchErr) return res.status(500).json({ error: 'Database Error Fetching Updated Result', details: fetchErr.message });
              res.json({ success: true, message: 'Test Result Updated Successfully', data: fetchResults[0] });
            }
          );
        });
      }

      const ins = `INSERT INTO result
        (ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE, ANSWERS, QUESTIONS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, pct, passStr, STATUS, STANDARD, DATE, answersJSON, questionsJSON];
      db.query(ins, params, (err, r) => {
        if (err) return res.status(500).json({ error: 'Database Error', details: err.message });
        db.query(
          'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result WHERE ID=? AND STANDARD=? AND DATE=?',
          [ID, STANDARD, DATE],
          (fetchErr, fetchResults) => {
            if (fetchErr) return res.status(500).json({ error: 'Database Error Fetching Saved Result', details: fetchErr.message });
            res.json({ success: true, id: r.insertId, message: 'Test Result Saved Successfully', data: fetchResults[0] });
          }
        );
      });
    }
  );
});

// Delete Result
app.delete('/api/results/:id/:standard/:date', async (req, res) => {
  const { id, standard, date } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
      [id, standard, date]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Result Not Found' });
    }
    
    res.json({ ok: true, message: 'Result Deleted Successfully' });
  } catch (e) {
    console.error('Result Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* ----------------------- PDF Generation ----------------------- */
app.get('/api/results/:id/:standard/:date/pdf', (req, res) => {
  const { id, standard, date } = req.params;
  
  // Fetch result data with answers
  db.query(
    'SELECT * FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
    [id, standard, date],
    (err, results) => {
      if (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Database Error', details: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Result Not Found' });
      }
      
      const result = results[0];
      const answers = result.ANSWERS ? JSON.parse(result.ANSWERS) : {};
      const questions = result.QUESTIONS ? JSON.parse(result.QUESTIONS) : [];
      
      // Create PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Test_result_${result.ID}_${result.NAME.replace(/\s+/g, '_')}.pdf`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('PTIS Test Result', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Premier Tubular Inspection Services', { align: 'center' });
      doc.moveDown(1);
      
      // Employee Info Box
      doc.rect(50, doc.y, 495, 100).stroke();
      const infoY = doc.y + 10;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Employee Information', 60, infoY);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Employee ID: ${result.ID}`, 60, infoY + 25);
      doc.text(`Name: ${String(result.NAME).trim()}`, 60, infoY + 40);
      doc.text(`Standard: ${result.STANDARD}`, 60, infoY + 55);
      doc.text(`Date: ${result.DATE}`, 60, infoY + 70);
      
      doc.text(`Status: ${result.STATUS}`, 320, infoY + 25);
      doc.text(`Score: ${result.PERCENTAGE}`, 320, infoY + 40);
      doc.text(`Total Questions: ${result.TOTAL_QUESTION}`, 320, infoY + 55);
      doc.text(`Pass Criteria: ${result.PASSING_CRITERIA}`, 320, infoY + 70);
      
      doc.y += 110;
      doc.moveDown(1);
      
      // Results Summary
      doc.rect(50, doc.y, 495, 75).stroke();
      const summaryY = doc.y + 10;
      doc.fontSize(12).font('Helvetica-Bold').text('Test Summary', 60, summaryY);
      doc.fontSize(10).font('Helvetica');
      
      const correctWidth = (result.CORRECT_ANSWER / result.TOTAL_QUESTION) * 150;
      const wrongWidth = (result.WRONG_ANSWER / result.TOTAL_QUESTION) * 150;
      
      doc.fillColor('#4CAF50').text(`[OK] Correct: ${result.CORRECT_ANSWER}`, 60, summaryY + 25);
      doc.rect(140, summaryY + 25, correctWidth, 10).fill('#4CAF50');
      
      doc.fillColor('#F44336').text(`[X] Wrong: ${result.WRONG_ANSWER}`, 60, summaryY + 40);
      doc.rect(140, summaryY + 40, wrongWidth, 10).fill('#F44336');
      
      doc.y += 85;
      doc.moveDown(1);
      
      // Questions and Answers
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Detailed Answers', { underline: true });
      doc.moveDown(0.5);
      
      if (questions && questions.length > 0) {
        console.log('Generating PDF For', questions.length, 'questions');
        console.log('Sample Question Fields:', Object.keys(questions[0]));
        questions.forEach((q, index) => {
          const userAnswer = answers[q.NO];
          const isCorrect = userAnswer === q.Answer;
          
          // Check if we need a new page BEFORE rendering this question
          // Estimate ~100 units needed per question (question + options + result)
          if (doc.y > 650) {
            doc.addPage();
          }
          
          // Question number and text
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
          doc.text(`Q${index + 1}. ${q.Question}`, { width: 495 });
          doc.moveDown(0.3);
          
          // Options
          doc.fontSize(9).font('Helvetica');
          const options = ['A', 'B', 'C', 'D'];
          options.forEach(opt => {
            const optText = q[`Opt_${opt}`];  // Fixed: Use Opt_A, Opt_B format
            if (optText) {
              const isUserAnswer = userAnswer === opt;
              const isCorrectAnswer = q.Answer === opt;
              
              let prefix = '   ';
              let color = '#000';
              
              if (isCorrectAnswer) {
                prefix = ' [OK] ';
                color = '#4CAF50';
                doc.font('Helvetica-Bold');
              } else if (isUserAnswer && !isCorrect) {
                prefix = ' [X] ';
                color = '#F44336';
                doc.font('Helvetica-Bold');
              } else {
                doc.font('Helvetica');
              }
              
              doc.fillColor(color).text(`${prefix}${opt}. ${optText}`, { width: 480 });
              doc.font('Helvetica');
            }
          });
          
          // Show result
          doc.moveDown(0.2);
          if (isCorrect) {
            doc.fillColor('#4CAF50').fontSize(9).font('Helvetica-Bold').text('[OK] CORRECT', { indent: 20 });
          } else {
            doc.fillColor('#F44336').fontSize(9).font('Helvetica-Bold').text(`[X] WRONG - Correct Answer: ${q.Answer}`, { indent: 20 });
          }
          
          doc.moveDown(0.5);
          doc.strokeColor('#ddd').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(10).fillColor('#999').text('No Detailed Answers Available.');
      }
      
      // Finalize PDF
      doc.end();
    }
  );
});

/* -------------------------- Routes inspector (SAFE) -------------------- */
app.get('/api/_routes', (req, res) => {
  try {
    const collect = (stack) => {
      const out = [];
      (stack || []).forEach((layer) => {
        // Direct route on the app or a nested router
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase());
          out.push({ methods, path: layer.route.path });
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          // Nested router: dive into its stack
          layer.handle.stack.forEach((sublayer) => {
            if (sublayer.route && sublayer.route.path) {
              const methods = Object.keys(sublayer.route.methods || {}).map(m => m.toUpperCase());
              out.push({ methods, path: sublayer.route.path });
            }
          });
        }
      });
      return out;
    };

    const stack = (app._router && app._router.stack) || [];
    const routes = collect(stack);

    res.json({
      express: require('express/package.json').version,
      count: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    });
  } catch (err) {
    console.error('Route Inspector Failed:', err);
    res.status(500).json({ error: 'Inspector Failed', message: err.message });
  }
});


/* ------------------------------ Debug --------------------------- */
app.get('/api/debug/standards', (req, res) => {
  db.query('SELECT DISTINCT Standard_List FROM standard', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query('SELECT DISTINCT Standard_List FROM info', (infoErr, infoResults) => {
      if (infoErr) return res.status(500).json({ error: infoErr.message });

      db.query('DESCRIBE questions', (descErr, columns) => {
        if (descErr) return res.status(500).json({ error: descErr.message });

        const columnNames = columns.map(col => col.Field);
        const possibleStandardColumns = ['Standard', 'Standard_List', 'Category'];
        const standardColumn = possibleStandardColumns.find(col => columnNames.includes(col)) || 'Standard';

        db.query(`SELECT DISTINCT ${standardColumn} AS Standard FROM questions`, (qErr, qResults) => {
          if (qErr) return res.status(500).json({ error: qErr.message });

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

/* -------------------------- Certificate Generation -------------- */
const { generateCertificate } = require('./certificateGenerator');

app.post('/api/certificates/generate', async (req, res) => {
  const { 
    emp_id, 
    emp_name, 
    test_date, 
    status, 
    standard, 
    percentage, 
    passing_criteria,
    is_combined,
    general_data,
    specific_data,
    practical_data,
    certification_type
  } = req.body;
  
  if (!emp_id || !emp_name || !test_date || !standard) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Fetch Certificate_Template from database for the standard
    let certificate_template = null;
    try {
      const [rows] = await pool.query(
        'SELECT Certificate_Template FROM standard WHERE Standard_List = ?',
        [standard]
      );
      if (rows && rows.length > 0 && rows[0].Certificate_Template) {
        certificate_template = rows[0].Certificate_Template;
        console.log(`Using custom template for ${standard}: ${certificate_template}`);
      }
    } catch (dbErr) {
      console.warn('Failed to fetch certificate template from DB:', dbErr);
    }

    let certOptions = {
      emp_id,
      emp_name,
      test_date,
      status: status || 'PASSED',
      standard,
      certification_type: certification_type || 'New',
      certificate_template // Pass the template override
    };
    
    // Check if this is a combined PT/MPT certificate
    if (is_combined && general_data && specific_data) {
      // Combined certificate with 2 or 3 rows
      certOptions.is_combined = true;
      certOptions.general_data = {
        standard: general_data.standard,
        percentage: general_data.percentage.toString().replace('%', ''),
        passing_criteria: general_data.passing_criteria.toString().replace('%', '')
      };
      certOptions.specific_data = {
        standard: specific_data.standard,
        percentage: specific_data.percentage.toString().replace('%', ''),
        passing_criteria: specific_data.passing_criteria.toString().replace('%', '')
      };
      
      // Add practical data if provided
      if (practical_data) {
        certOptions.practical_data = {
          standard: practical_data.standard,
          percentage: practical_data.percentage.toString().replace('%', ''),
          passing_criteria: practical_data.passing_criteria.toString().replace('%', '')
        };
      }
    } else {
      // Regular single certificate
      certOptions.percentage = percentage ? percentage.toString().replace('%', '') : null;
      certOptions.passing_criteria = passing_criteria ? passing_criteria.toString().replace('%', '') : '80';
    }
    
    const result = await generateCertificate(certOptions);
    
    if (result.success) {
      // Send the PDF file for download
      res.download(result.path, result.filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading certificate' });
          }
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to generate certificate' });
    }
    
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Failed to generate certificate', details: error.message });
  }
});

/* ------------------------------ Health -------------------------- */
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) return res.status(500).json({ status: 'Error', database: 'Disconnected', error: err.message });
    res.json({ status: 'Healthy', database: 'Connected', timestamp: new Date().toISOString() });
  });
});

/* -------------------------- Error handlers ---------------------- */
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint Not Found', path: req.originalUrl, method: req.method });
});

/* --------------------------- Start server ----------------------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀 PTIS Server Details:');
  console.log(`   • File: ${__filename}`);
  console.log(`   • Server running on: http://localhost:${PORT}`);
  console.log(`   • Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   • Database: ${process.env.DB_NAME || 'ptis_testing'}`);
  console.log('   • Visit http://localhost:' + PORT + '/api/_routes to verify routes.');
});

/* ------------------------ Graceful shutdown --------------------- */
process.on('SIGTERM', async () => {
  console.log('Shutting Down Gracefully...');
  try { await pool.end(); } catch {}
  db.end(() => {
    console.log('Database Connection(s) Closed.');
    process.exit(0);
  });
});
