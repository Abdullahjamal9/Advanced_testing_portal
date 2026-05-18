// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

/* ----------------------- Attachments Setup ---------------------- */
const PRACTICAL_ATTACHMENTS_DIR = path.resolve(__dirname, 'practical-attachments');
const PRACTICAL_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const MIME_EXTENSION_MAP = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

/* ------------------ Certificate Templates Setup ---------------- */
const CERTIFICATE_TEMPLATES_DIR = path.resolve(__dirname, '..', 'certificates', 'templates');
const CERTIFICATE_TEMPLATE_MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_TEMPLATE_MIME_TYPES = new Set(['application/pdf']);
const ALLOWED_TEMPLATE_EXTENSIONS = new Set(['.pdf']);

if (!fs.existsSync(PRACTICAL_ATTACHMENTS_DIR)) {
  fs.mkdirSync(PRACTICAL_ATTACHMENTS_DIR, { recursive: true });
}

if (!fs.existsSync(CERTIFICATE_TEMPLATES_DIR)) {
  fs.mkdirSync(CERTIFICATE_TEMPLATES_DIR, { recursive: true });
}

const sanitizeBaseName = (name) => {
  const base = path.basename(name || '', path.extname(name || '')).trim();
  const cleaned = base.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned.slice(0, 80) || 'attachment';
};

const sanitizeTemplateBaseName = (name) => {
  const base = path.basename(name || '', path.extname(name || '')).trim();
  const cleaned = base.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned.slice(0, 80) || 'template';
};

const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRACTICAL_ATTACHMENTS_DIR),
  filename: (_req, file, cb) => {
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const ext = originalExt || MIME_EXTENSION_MAP[file.mimetype] || '';
    const base = sanitizeBaseName(file.originalname);
    const randomTag = crypto.randomBytes(6).toString('hex');
    cb(null, `${Date.now()}_${randomTag}_${base}${ext}`);
  }
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: PRACTICAL_ATTACHMENT_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeOk = ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_ATTACHMENT_EXTENSIONS.has(ext);
    if (mimeOk || extOk) return cb(null, true);
    return cb(new Error('Unsupported attachment type. Only PDF, DOC, DOCX files are allowed.'));
  }
});

const templateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CERTIFICATE_TEMPLATES_DIR),
  filename: (req, file, cb) => {
    const explicitName = String(req.body?.template_name || '').trim();
    const standardName = String(req.body?.standard || '').trim();
    const baseSource = explicitName || standardName || file.originalname;
    const base = sanitizeTemplateBaseName(baseSource);
    cb(null, `${base}.pdf`);
  }
});

const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: CERTIFICATE_TEMPLATE_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeOk = ALLOWED_TEMPLATE_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_TEMPLATE_EXTENSIONS.has(ext);
    if (mimeOk || extOk) return cb(null, true);
    return cb(new Error('Unsupported template type. Only PDF files are allowed.'));
  }
});

const resolveAttachmentPath = (relativePath) => {
  if (!relativePath) return null;
  const absolutePath = path.resolve(__dirname, relativePath);
  const safeRoot = PRACTICAL_ATTACHMENTS_DIR + path.sep;
  if (!absolutePath.startsWith(safeRoot)) return null;
  return absolutePath;
};

const deleteAttachmentFile = async (relativePath) => {
  const absolutePath = resolveAttachmentPath(relativePath);
  if (!absolutePath) return;
  try {
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  } catch (err) {
    console.warn('Failed to delete attachment file:', err.message);
  }
};

/* -------------------------- Middleware -------------------------- */
app.use(express.json({ limit: '50mb' })); // Increased limit for Excel uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl / same-origin requests with no Origin header.
    if (!origin) return callback(null, true);

    // Explicit allow-list.
    if (allowedOrigins.has(origin)) return callback(null, true);

    // Common local/tunnel patterns.
    if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return callback(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin)) return callback(null, true);
    if (/^https:\/\/.*\.github\.dev$/i.test(origin)) return callback(null, true);
    if (/^https:\/\/.*\.app\.github\.dev$/i.test(origin)) return callback(null, true);

    // Keep this permissive for shared-port usage; tighten in production if needed.
    return callback(null, true);
  },
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

async function ensureCertificateHistoryTable() {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS certificate_generation_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        emp_id VARCHAR(100) NOT NULL,
        standard VARCHAR(255) NOT NULL,
        certification_type VARCHAR(50) NOT NULL DEFAULT 'New',
        certificate_no VARCHAR(255) NOT NULL,
        previous_certificate_no VARCHAR(255) NULL,
        test_date VARCHAR(100) NULL,
        generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cert_log_lookup (emp_id, standard, generated_at)
      )`
    );
    console.log('✅ Certificate generation log table ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure certificate_generation_log table:', err.message);
  }
}

async function ensureResultAttachmentColumns() {
  const dbName = process.env.DB_NAME || 'ptis_testing';
  const columns = [
    { name: 'PRACTICAL_ATTACHMENT_PATH', sql: 'VARCHAR(1024) NULL' },
    { name: 'PRACTICAL_ATTACHMENT_NAME', sql: 'VARCHAR(255) NULL' },
    { name: 'PRACTICAL_ATTACHMENT_MIME', sql: 'VARCHAR(100) NULL' }
  ];

  try {
    const placeholders = columns.map(() => '?').join(',');
    const params = [dbName, ...columns.map((c) => c.name)];
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME = 'result'
         AND COLUMN_NAME IN (${placeholders})`,
      params
    );
    const existing = new Set(rows.map((r) => r.COLUMN_NAME));
    const alterParts = columns
      .filter((c) => !existing.has(c.name))
      .map((c) => `ADD COLUMN ${c.name} ${c.sql}`);

    if (alterParts.length) {
      await pool.query(`ALTER TABLE result ${alterParts.join(', ')}`);
      console.log('✅ Result attachment columns ready');
    }
  } catch (err) {
    console.warn('⚠️ Could not ensure result attachment columns:', err.message);
  }
}

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

ensureCertificateHistoryTable();
ensureResultAttachmentColumns();

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
    const files = fs.readdirSync(CERTIFICATE_TEMPLATES_DIR);
    
    // Get PDF template names without extension
    const templates = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => path.parse(file).name)
      .sort();
    
    res.json(templates);
  } catch (error) {
    console.error('Error reading templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

app.post('/api/certificate-templates', templateUpload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Template file is required' });
    }

    const templateBase = path.parse(req.file.filename).name;
    const standard = String(req.body?.standard || '').trim();

    if (standard) {
      const [result] = await pool.query(
        'UPDATE standard SET Certificate_Template = ? WHERE Standard_List = ?',
        [templateBase, standard]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Standard Not Found', template: templateBase });
      }
    }

    res.json({ ok: true, template: templateBase, filename: req.file.filename, standard: standard || null });
  } catch (error) {
    console.error('Template upload error:', error);
    res.status(500).json({ error: 'Failed to upload template', details: error.message });
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
  const employeeId = String(ID ?? '').trim();
  const employeeName = String(Name ?? '').trim();
  if (!employeeId || !employeeName) return res.status(400).json({ error: 'ID and Name are Required' });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO employees (ID, Name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE Name = VALUES(Name)`,
      [employeeId, employeeName]
    );

    const [syncResult] = await conn.query(
      'UPDATE result SET NAME = ? WHERE ID = ?',
      [employeeName, employeeId]
    );

    await conn.commit();
    res.json({ ok: true, ID: employeeId, Name: employeeName, syncedResults: syncResult.affectedRows });
  } catch (e) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    console.error('Employees Upsert Error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { Name } = req.body || {};
  const employeeId = String(id ?? '').trim();
  const employeeName = String(Name ?? '').trim();
  if (!employeeName) return res.status(400).json({ error: 'Name is Required' });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [r] = await conn.query('UPDATE employees SET Name=? WHERE ID=?', [employeeName, employeeId]);
    if (r.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Employee Not Found' });
    }

    const [syncResult] = await conn.query(
      'UPDATE result SET NAME = ? WHERE ID = ?',
      [employeeName, employeeId]
    );

    await conn.commit();
    res.json({ ok: true, ID: employeeId, Name: employeeName, syncedResults: syncResult.affectedRows });
  } catch (e) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    console.error('Employees Update Error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) conn.release();
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
const normalizeQuestionKey = (text) => String(text || '').trim().toLowerCase();

// Questions count endpoint – returns DB total and per-standard breakdown
app.get('/api/questions/count', (req, res) => {
  db.query('DESCRIBE questions', (err, columns) => {
    if (err) return res.status(500).json({ error: 'Database Error', details: err.message });

    const possibleStandardColumns = ['Standard', 'Standard_List', 'Category'];
    const columnNames = columns.map(col => col.Field);
    const standardColumn = possibleStandardColumns.find(col => columnNames.includes(col)) || 'Standard';

    const totalQ = 'SELECT COUNT(*) AS total FROM questions';
    db.query(totalQ, [], (e1, r1) => {
      if (e1) return res.status(500).json({ error: 'Database Error', details: e1.message });
      const total = r1[0].total;

      // Per-standard counts (trimmed)
      const breakdownQ = `
        SELECT TRIM(${standardColumn}) AS std, COUNT(*) AS cnt
        FROM questions
        GROUP BY TRIM(${standardColumn})
        ORDER BY cnt DESC
      `;
      db.query(breakdownQ, [], (e2, r2) => {
        if (e2) return res.status(500).json({ error: 'Database Error', details: e2.message });

        // Count questions whose standard doesn't match any row in the standard table
        const unmatchedQ = `
          SELECT COUNT(*) AS unmatched
          FROM questions
          WHERE TRIM(${standardColumn}) NOT IN (
            SELECT TRIM(Standard_List) FROM standard
          ) OR ${standardColumn} IS NULL OR TRIM(${standardColumn}) = ''
        `;
        db.query(unmatchedQ, [], (e3, r3) => {
          if (e3) return res.status(500).json({ error: 'Database Error', details: e3.message });
          res.json({
            total,
            unmatched: r3[0].unmatched,
            breakdown: r2
          });
        });
      });
    });
  });
});

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
      const q = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, TRIM(${standardColumn}) AS Standard, TRIM(${standardColumn}) AS Standard_List
                 FROM questions ORDER BY RAND()`;
      return db.query(q, [], (qErr, rows) => {
        if (qErr) return res.status(500).json({ error: 'Database Error', details: qErr.message });
        res.json(rows);
      });
    }

    if (standard) {
      const exact = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, TRIM(${standardColumn}) AS Standard, TRIM(${standardColumn}) AS Standard_List
                     FROM questions WHERE TRIM(${standardColumn}) = ? ORDER BY ${idColumn}`;
      return db.query(exact, [standard.trim()], (e1, r1) => {
        if (!e1 && r1.length) return res.json(r1);
        const like = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, TRIM(${standardColumn}) AS Standard, TRIM(${standardColumn}) AS Standard_List
                      FROM questions WHERE TRIM(${standardColumn}) LIKE ? ORDER BY ${idColumn}`;
        db.query(like, [`%${standard.trim()}%`], (e2, r2) => {
          if (e2) return res.status(500).json({ error: 'Database Error', details: e2.message });
          res.json(r2);
        });
      });
    }

    const all = `SELECT ${idColumn} AS NO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, TRIM(${standardColumn}) AS Standard, TRIM(${standardColumn}) AS Standard_List
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
    const questionKey = normalizeQuestionKey(Question);
    const [dupRows] = await pool.query(
      `SELECT 1 FROM questions
       WHERE LOWER(TRIM(Question)) = ?
       LIMIT 1`,
      [questionKey]
    );
    if (dupRows.length > 0) {
      return res.status(409).json({ error: 'Duplicate question already exists' });
    }

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
  const seenKeys = new Set();

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

    const questionKey = normalizeQuestionKey(q.Question);
    const dedupeKey = questionKey;

    if (seenKeys.has(dedupeKey)) {
      failedCount++;
      errors.push({
        row: rowNum,
        error: 'Duplicate question in upload file',
        question: q.Question
      });
      continue;
    }
    seenKeys.add(dedupeKey);

    try {
      const [dupRows] = await pool.query(
        `SELECT 1 FROM questions
         WHERE LOWER(TRIM(Question)) = ?
         LIMIT 1`,
        [questionKey]
      );
      if (dupRows.length > 0) {
        failedCount++;
        errors.push({
          row: rowNum,
          error: 'Duplicate question already exists',
          question: q.Question
        });
        continue;
      }

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

// Bulk Delete Questions
app.delete('/api/questions/bulk', async (req, res) => {
  const { nos } = req.body || {};
  if (!Array.isArray(nos) || nos.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty array of question IDs in body.nos' });
  }
  // Validate all values are numeric to prevent injection
  const numericNos = nos.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  if (numericNos.length === 0) {
    return res.status(400).json({ error: 'No valid numeric IDs provided' });
  }
  try {
    const placeholders = numericNos.map(() => '?').join(',');
    const [result] = await pool.query(
      `DELETE FROM questions WHERE NO IN (${placeholders})`,
      numericNos
    );
    res.json({ ok: true, deleted: result.affectedRows });
  } catch (e) {
    console.error('Questions Bulk Delete Error:', e);
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
  const newStandard = Standard_List || standard;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (newStandard !== standard) {
      const [dupRows] = await conn.query(
        'SELECT 1 FROM standard WHERE Standard_List = ? LIMIT 1',
        [newStandard]
      );
      if (dupRows.length > 0) {
        await conn.rollback();
        return res.status(409).json({ error: 'Standard already exists' });
      }
    }

    const [result] = await conn.query(
      'UPDATE standard SET Standard_List = ?, Short_Name = ?, Negative_Marking = ?, Certificate_Template = ? WHERE Standard_List = ?',
      [newStandard, Short_Name || '', Negative_Marking || 'Yes', Certificate_Template || '', standard]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Standard Not Found' });
    }

    if (newStandard !== standard) {
      await conn.query(
        'UPDATE info SET Standard_List = ? WHERE Standard_List = ?',
        [newStandard, standard]
      );

      const [columns] = await conn.query('SHOW COLUMNS FROM questions');
      const columnNames = columns.map(col => col.Field);
      const possibleStandardColumns = ['Standard_List', 'Standard', 'Category'];
      const standardColumn = possibleStandardColumns.find(col => columnNames.includes(col)) || 'Standard_List';

      await conn.query(
        `UPDATE questions SET ${standardColumn} = ? WHERE ${standardColumn} = ?`,
        [newStandard, standard]
      );

      await conn.query(
        'UPDATE result SET STANDARD = ? WHERE STANDARD = ?',
        [newStandard, standard]
      );

      try {
        await conn.query(
          'UPDATE certificate_generation_log SET standard = ? WHERE standard = ?',
          [newStandard, standard]
        );
      } catch (logErr) {
        console.warn('Certificate log update skipped:', logErr.message);
      }
    }

    await conn.commit();
    res.json({ ok: true, Standard_List: newStandard });
  } catch (e) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    console.error('Standards Update Error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) conn.release();
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
    `SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE,
            CASE WHEN QUESTIONS IS NOT NULL AND QUESTIONS <> '' AND QUESTIONS <> '[]' THEN 1 ELSE 0 END AS HAS_ANSWER_SHEET,
            PRACTICAL_ATTACHMENT_NAME,
            CASE WHEN PRACTICAL_ATTACHMENT_PATH IS NOT NULL AND PRACTICAL_ATTACHMENT_PATH <> '' THEN 1 ELSE 0 END AS HAS_PRACTICAL_ATTACHMENT
    FROM result
    ORDER BY DATE ASC, ID`,
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
    CERTIFICATION_TYPE,
    ORIGINAL_DATE,
    original_date,
    originalDate
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

  const dateValue = String(DATE || '').trim();
  const originalDateValue = String(ORIGINAL_DATE ?? original_date ?? originalDate ?? '').trim();
  const lookupDate = originalDateValue || dateValue;

  // Store answers and questions as JSON
  const answersJSON = answers ? JSON.stringify(answers) : null;
  const questionsJSON = questions ? JSON.stringify(questions) : null;

  db.query(
    'SELECT ID FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
    [ID, STANDARD, lookupDate],
    (checkErr, checkResults) => {
      if (checkErr) return res.status(500).json({ error: 'Database Error Checking For Duplicates', details: checkErr.message });

      if (checkResults.length > 0) {
        const doUpdate = () => {
          const sql = `UPDATE result
                       SET NAME=?, TOTAL_QUESTION=?, CORRECT_ANSWER=?, WRONG_ANSWER=?, PERCENTAGE=?, PASSING_CRITERIA=?, STATUS=?, ANSWERS=?, QUESTIONS=?, DATE=?
                       WHERE ID=? AND STANDARD=? AND DATE=?`;
          const params = [
            NAME,
            TOTAL_QUESTION,
            CORRECT_ANSWER,
            WRONG_ANSWER,
            pct,
            passStr,
            STATUS,
            answersJSON,
            questionsJSON,
            dateValue,
            ID,
            STANDARD,
            lookupDate
          ];
          return db.query(sql, params, (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Database Error Updating Result', details: updateErr.message });
            db.query(
              'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result WHERE ID=? AND STANDARD=? AND DATE=?',
              [ID, STANDARD, dateValue],
              (fetchErr, fetchResults) => {
                if (fetchErr) return res.status(500).json({ error: 'Database Error Fetching Updated Result', details: fetchErr.message });
                res.json({ success: true, message: 'Test Result Updated Successfully', data: fetchResults[0] });
              }
            );
          });
        };

        if (originalDateValue && originalDateValue !== dateValue) {
          return db.query(
            'SELECT ID FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
            [ID, STANDARD, dateValue],
            (conflictErr, conflictResults) => {
              if (conflictErr) {
                return res.status(500).json({ error: 'Database Error Checking Date Conflict', details: conflictErr.message });
              }
              if (conflictResults.length > 0) {
                return res.status(409).json({ error: 'Result already exists for this date' });
              }
              return doUpdate();
            }
          );
        }

        return doUpdate();
      }

      const ins = `INSERT INTO result
        (ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE, ANSWERS, QUESTIONS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, pct, passStr, STATUS, STANDARD, dateValue, answersJSON, questionsJSON];
      db.query(ins, params, (err, r) => {
        if (err) return res.status(500).json({ error: 'Database Error', details: err.message });
        db.query(
          'SELECT ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE FROM result WHERE ID=? AND STANDARD=? AND DATE=?',
          [ID, STANDARD, dateValue],
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
    const [rows] = await pool.query(
      'SELECT PRACTICAL_ATTACHMENT_PATH FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
      [id, standard, date]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Result Not Found' });
    }

    const attachmentPaths = Array.from(
      new Set(rows.map((row) => row.PRACTICAL_ATTACHMENT_PATH).filter(Boolean))
    );
    const [result] = await pool.query(
      'DELETE FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ?',
      [id, standard, date]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Result Not Found' });
    }

    for (const attachmentPath of attachmentPaths) {
      await deleteAttachmentFile(attachmentPath);
    }

    res.json({ ok: true, message: 'Result Deleted Successfully', deleted: result.affectedRows });
  } catch (e) {
    console.error('Result Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* -------------------- Practical Attachments -------------------- */
app.post('/api/results/:id/:standard/:date/attachment', attachmentUpload.single('attachment'), async (req, res) => {
  const { id, standard, date } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Attachment file is required' });
  }

  const relativePath = path.join('practical-attachments', req.file.filename);

  try {
    const [rows] = await pool.query(
      'SELECT PRACTICAL_ATTACHMENT_PATH FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ? LIMIT 1',
      [id, standard, date]
    );

    if (!rows.length) {
      await deleteAttachmentFile(relativePath);
      return res.status(404).json({ error: 'Result Not Found' });
    }

    const previousPath = rows[0].PRACTICAL_ATTACHMENT_PATH;

    await pool.query(
      `UPDATE result
       SET PRACTICAL_ATTACHMENT_PATH = ?, PRACTICAL_ATTACHMENT_NAME = ?, PRACTICAL_ATTACHMENT_MIME = ?
       WHERE ID = ? AND STANDARD = ? AND DATE = ?`,
      [relativePath, req.file.originalname, req.file.mimetype, id, standard, date]
    );

    if (previousPath && previousPath !== relativePath) {
      await deleteAttachmentFile(previousPath);
    }

    res.json({ ok: true, filename: req.file.originalname });
  } catch (err) {
    console.error('Attachment Upload Error:', err);
    await deleteAttachmentFile(relativePath);
    res.status(500).json({ error: 'Failed to upload attachment', details: err.message });
  }
});

app.get('/api/results/:id/:standard/:date/attachment', async (req, res) => {
  const { id, standard, date } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT PRACTICAL_ATTACHMENT_PATH, PRACTICAL_ATTACHMENT_NAME FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ? LIMIT 1',
      [id, standard, date]
    );

    if (!rows.length || !rows[0].PRACTICAL_ATTACHMENT_PATH) {
      return res.status(404).json({ error: 'Attachment Not Found' });
    }

    const absolutePath = resolveAttachmentPath(rows[0].PRACTICAL_ATTACHMENT_PATH);
    if (!absolutePath || !fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Attachment File Missing' });
    }

    const downloadName = rows[0].PRACTICAL_ATTACHMENT_NAME || path.basename(absolutePath);
    res.download(absolutePath, downloadName, (err) => {
      if (err) {
        console.error('Attachment Download Error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download attachment' });
        }
      }
    });
  } catch (err) {
    console.error('Attachment Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch attachment', details: err.message });
  }
});

app.delete('/api/results/:id/:standard/:date/attachment', async (req, res) => {
  const { id, standard, date } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT PRACTICAL_ATTACHMENT_PATH FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ? LIMIT 1',
      [id, standard, date]
    );

    if (!rows.length || !rows[0].PRACTICAL_ATTACHMENT_PATH) {
      return res.status(404).json({ error: 'Attachment Not Found' });
    }

    const attachmentPath = rows[0].PRACTICAL_ATTACHMENT_PATH;
    await pool.query(
      `UPDATE result
       SET PRACTICAL_ATTACHMENT_PATH = NULL,
           PRACTICAL_ATTACHMENT_NAME = NULL,
           PRACTICAL_ATTACHMENT_MIME = NULL
       WHERE ID = ? AND STANDARD = ? AND DATE = ?`,
      [id, standard, date]
    );

    await deleteAttachmentFile(attachmentPath);
    res.json({ ok: true });
  } catch (err) {
    console.error('Attachment Remove Error:', err);
    res.status(500).json({ error: 'Failed to remove attachment', details: err.message });
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

app.get('/api/certificates/previous-number', async (req, res) => {
  const empId = String(req.query.emp_id || '').trim();
  const standard = String(req.query.standard || '').trim();

  if (!empId || !standard) {
    return res.status(400).json({ error: 'emp_id and standard are required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT certificate_no
       FROM certificate_generation_log
       WHERE emp_id = ? AND standard = ?
       ORDER BY generated_at DESC, id DESC
       LIMIT 1`,
      [empId, standard]
    );

    res.json({
      previous_certificate_no: rows.length > 0 ? rows[0].certificate_no : ''
    });
  } catch (error) {
    console.error('Previous certificate lookup error:', error);
    res.status(500).json({ error: 'Failed to fetch previous certificate number', details: error.message });
  }
});

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
    certification_type,
    previous_certificate_no
  } = req.body;
  
  if (!emp_id || !emp_name || !test_date || !standard) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedStandard = String(standard || '').trim();
  const resolvedCertificationType = certification_type || 'New';

  const isRecertification = resolvedCertificationType === 'Recertification';
  const trimmedPreviousCertificateNo = String(previous_certificate_no || '').trim();
  if (isRecertification && !trimmedPreviousCertificateNo) {
    return res.status(400).json({ error: 'Previous Certificate No. is required for recertification' });
  }

  try {
    // Fetch Certificate_Template from database for the standard
    let certificate_template = null;
    try {
      const candidates = new Set();
      if (is_combined && general_data?.standard) {
        candidates.add(String(general_data.standard).trim());
      }
      if (is_combined && specific_data?.standard) {
        candidates.add(String(specific_data.standard).trim());
      }
      candidates.add(normalizedStandard);

      for (const candidate of candidates) {
        if (!candidate) continue;
        const [rows] = await pool.query(
          'SELECT Certificate_Template FROM standard WHERE Standard_List = ?',
          [candidate]
        );
        if (rows && rows.length > 0 && rows[0].Certificate_Template) {
          certificate_template = String(rows[0].Certificate_Template).trim();
          console.log(`Using custom template for ${candidate}: ${certificate_template}`);
          break;
        }
      }
    } catch (dbErr) {
      console.warn('Failed to fetch certificate template from DB:', dbErr);
    }

    let certOptions = {
      emp_id,
      emp_name,
      test_date,
      status: status || 'PASSED',
      standard: normalizedStandard,
      certification_type: resolvedCertificationType,
      previous_certificate_no: isRecertification ? trimmedPreviousCertificateNo : null,
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
      try {
        await pool.query(
          `INSERT INTO certificate_generation_log
          (emp_id, standard, certification_type, certificate_no, previous_certificate_no, test_date)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            String(emp_id).trim(),
            normalizedStandard,
            resolvedCertificationType,
            String(result.certificateNumber || '').trim(),
            isRecertification ? trimmedPreviousCertificateNo : null,
            String(test_date || '').trim() || null
          ]
        );
      } catch (logError) {
        console.warn('Certificate generation log insert failed:', logError.message);
      }

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
  if (err && (err instanceof multer.MulterError || err.code === 'LIMIT_FILE_SIZE')) {
    return res.status(400).json({ error: err.message || 'Invalid attachment upload' });
  }
  if (err && typeof err.message === 'string' && /attachment/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  if (err && typeof err.message === 'string' && /template/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
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
