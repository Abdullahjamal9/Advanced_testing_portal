require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

const DEFAULT_EXCEL_PATH = path.join(__dirname, '..', 'results.xlsx');

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\u00d7/g, 'x')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function safeString(value) {
  return String(value ?? '').trim();
}

function normalizePersonName(value) {
  return safeString(value)
    .toLowerCase()
    .replace(/^mr\.?\s+/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseJsonArray(value) {
  const raw = safeString(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toInteger(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parsePercentage(value) {
  if (value == null || value === '') return null;
  const raw = safeString(value);
  if (!raw) return null;

  const numeric = parseFloat(raw.replace('%', ''));
  if (!Number.isFinite(numeric)) return null;

  const pct = numeric <= 1 ? numeric * 100 : numeric;
  return `${pct.toFixed(2)}%`;
}

function parsePassingCriteria(value) {
  if (value == null || value === '') return null;
  const raw = safeString(value);
  if (!raw) return null;

  const numeric = parseFloat(raw.replace('%', ''));
  if (!Number.isFinite(numeric)) return null;

  const pct = numeric <= 1 ? numeric * 100 : numeric;
  const rounded = Number.isInteger(pct) ? String(pct) : pct.toFixed(2);
  return `${rounded}%`;
}

function parsePercentNumber(value) {
  if (value == null || value === '') return null;
  const numeric = parseFloat(String(value).replace('%', '').trim());
  if (!Number.isFinite(numeric)) return null;
  return numeric <= 1 ? numeric * 100 : numeric;
}

function normalizeStatus(status, percentage, passingCriteria) {
  const raw = safeString(status).toLowerCase();
  if (raw === 'pass' || raw === 'passed') return 'Pass';
  if (raw === 'fail' || raw === 'failed') return 'Fail';

  const pct = parsePercentNumber(percentage);
  const pass = parsePercentNumber(passingCriteria);
  if (pct == null || pass == null) return 'Fail';
  return pct >= pass ? 'Pass' : 'Fail';
}

function pickIdColumn(columnNames) {
  const idCandidates = ['NO', 'ID', 'Question_ID', 'Number', 'Num', 'Sr_No'];
  return idCandidates.find(col => columnNames.includes(col));
}

function optionLetterFromText(questionRow, text) {
  const target = normalizeText(text);
  if (!target) return null;

  const letters = ['A', 'B', 'C', 'D'];
  for (const letter of letters) {
    const optValue = normalizeText(questionRow[`Opt_${letter}`]);
    if (optValue && optValue === target) return letter;
  }

  for (const letter of letters) {
    const optValue = normalizeText(questionRow[`Opt_${letter}`]);
    if (!optValue) continue;
    if (optValue.includes(target) || target.includes(optValue)) {
      return letter;
    }
  }

  if (/^[abcd]$/i.test(String(text).trim())) return String(text).trim().toUpperCase();
  return null;
}

function deriveCorrectLetter(questionRow) {
  const answerRaw = safeString(questionRow.Answer);
  if (/^[ABCD]$/i.test(answerRaw)) return answerRaw.toUpperCase();

  const byText = optionLetterFromText(questionRow, answerRaw);
  return byText || 'A';
}

function buildPlaceholderQuestion(answerItem, fallbackIndex, standardName) {
  const qnoRaw = safeString(answerItem.qno) || `missing_${fallbackIndex + 1}`;
  const choiceText = safeString(answerItem.choice) || 'No recorded choice';
  const correctText = safeString(answerItem.correct) || choiceText;
  const isSame = normalizeText(choiceText) === normalizeText(correctText);

  const questionObj = {
    NO: qnoRaw,
    Question: `Placeholder question for qno ${qnoRaw}`,
    Opt_A: correctText,
    Opt_B: isSame ? '' : choiceText,
    Opt_C: '',
    Opt_D: '',
    Answer: 'A',
    Standard_List: standardName || ''
  };

  let userLetter = 'A';
  if (!isSame) {
    if (answerItem.is_correct === false) userLetter = 'B';
    else if (answerItem.is_correct === true) userLetter = 'A';
    else userLetter = normalizeText(choiceText) === normalizeText(correctText) ? 'A' : 'B';
  }

  return { questionObj, userLetter, qno: qnoRaw };
}

async function buildQuestionMap(conn, qnos) {
  const uniqueQnos = Array.from(new Set(qnos.filter(Boolean).map(v => safeString(v))));
  const map = new Map();

  const [colRows] = await conn.query('DESCRIBE questions');
  const colNames = colRows.map(c => c.Field);
  const idCol = pickIdColumn(colNames);

  if (!idCol || uniqueQnos.length === 0) {
    return { questionMap: map, idCol };
  }

  const chunkSize = 500;
  for (let i = 0; i < uniqueQnos.length; i += chunkSize) {
    const chunk = uniqueQnos.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');
    const [rows] = await conn.query(
      `SELECT ${idCol} AS __QNO, Question, Opt_A, Opt_B, Opt_C, Opt_D, Answer, Standard_List FROM questions WHERE ${idCol} IN (${placeholders})`,
      chunk
    );

    rows.forEach(row => {
      map.set(safeString(row.__QNO), row);
    });
  }

  return { questionMap: map, idCol };
}

async function importResults() {
  const excelPathArg = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_EXCEL_PATH;
  const workbook = XLSX.readFile(excelPathArg);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const parsedAnswerRows = rows.map((row, idx) => ({
    __index: idx + 2,
    ...row,
    __answers: parseJsonArray(row.Answers)
  }));

  const allQnos = [];
  parsedAnswerRows.forEach(row => {
    row.__answers.forEach(item => {
      if (item && item.qno != null && safeString(item.qno)) {
        allQnos.push(safeString(item.qno));
      }
    });
  });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ptis_testing'
  });

  try {
    const { questionMap } = await buildQuestionMap(conn, allQnos);
    const [employeeRows] = await conn.query('SELECT ID, Name FROM employees');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let placeholderQuestions = 0;
    let unmappedChoiceCount = 0;
    let resolvedNonNumericIds = 0;
    const missingQnos = new Set();
    const unresolvedRows = [];

    await conn.beginTransaction();

    for (const row of parsedAnswerRows) {
      const rawId = safeString(row.ID);
      const name = safeString(row.NAME);
      const standard = safeString(row.STANDARD);
      const date = safeString(row.DATE);

      let id = toInteger(rawId, NaN);

      if (!Number.isFinite(id) && name) {
        const targetName = normalizePersonName(name);
        const candidates = employeeRows.filter(emp => {
          const empNorm = normalizePersonName(emp.Name);
          if (!empNorm || !targetName) return false;
          return empNorm === targetName || empNorm.includes(targetName) || targetName.includes(empNorm);
        });

        if (candidates.length === 1) {
          id = toInteger(candidates[0].ID, NaN);
          if (Number.isFinite(id)) resolvedNonNumericIds += 1;
        }
      }

      if (!Number.isFinite(id) || !name || !standard || !date) {
        skipped += 1;
        unresolvedRows.push({
          excelRow: row.__index,
          rawId,
          name,
          standard,
          date
        });
        continue;
      }

      const totalQuestion = toInteger(row['TOTAL QUESTION'], 0);
      const correctAnswer = toInteger(row['CORRECT ANSWER'], 0);
      let wrongAnswer = toInteger(row['WRONG ANSWER'], NaN);
      if (!Number.isFinite(wrongAnswer)) {
        wrongAnswer = Math.max(0, totalQuestion - correctAnswer);
      }

      const percentage = parsePercentage(row.PERCENTAGE) || `${((correctAnswer / Math.max(totalQuestion, 1)) * 100).toFixed(2)}%`;
      const passingCriteria = parsePassingCriteria(row['PASSING CRITERIA %']) || '75%';
      const status = normalizeStatus(row.STATUS, percentage, passingCriteria);

      const answersObj = {};
      const questionsArr = [];

      row.__answers.forEach((item, idx) => {
        const qno = safeString(item.qno);
        if (!qno) return;

        const qRow = questionMap.get(qno);

        if (!qRow) {
          const placeholder = buildPlaceholderQuestion(item, idx, standard);
          questionsArr.push(placeholder.questionObj);
          answersObj[qno] = placeholder.userLetter;
          placeholderQuestions += 1;
          missingQnos.add(qno);
          return;
        }

        const correctLetter = deriveCorrectLetter(qRow);
        let userLetter = optionLetterFromText(qRow, item.choice);
        if (!userLetter && item && item.choice != null && /^[ABCD]$/i.test(String(item.choice).trim())) {
          userLetter = String(item.choice).trim().toUpperCase();
        }

        if (!userLetter) {
          if (item.is_correct === true) userLetter = correctLetter;
          else if (item.is_correct === false) {
            userLetter = ['A', 'B', 'C', 'D'].find(letter => letter !== correctLetter && safeString(qRow[`Opt_${letter}`])) || correctLetter;
          } else {
            userLetter = correctLetter;
          }
          unmappedChoiceCount += 1;
        }

        questionsArr.push({
          NO: qRow.__QNO,
          Question: qRow.Question || '',
          Opt_A: qRow.Opt_A || '',
          Opt_B: qRow.Opt_B || '',
          Opt_C: qRow.Opt_C || '',
          Opt_D: qRow.Opt_D || '',
          Answer: correctLetter,
          Standard_List: qRow.Standard_List || standard
        });

        answersObj[qno] = userLetter;
      });

      const answersJson = JSON.stringify(answersObj);
      const questionsJson = JSON.stringify(questionsArr);

      const [existing] = await conn.query(
        'SELECT 1 FROM result WHERE ID = ? AND STANDARD = ? AND DATE = ? LIMIT 1',
        [id, standard, date]
      );

      if (existing.length > 0) {
        await conn.query(
          `UPDATE result
           SET NAME = ?, TOTAL_QUESTION = ?, CORRECT_ANSWER = ?, WRONG_ANSWER = ?, PERCENTAGE = ?, PASSING_CRITERIA = ?, STATUS = ?, ANSWERS = ?, QUESTIONS = ?
           WHERE ID = ? AND STANDARD = ? AND DATE = ?`,
          [name, totalQuestion, correctAnswer, wrongAnswer, percentage, passingCriteria, status, answersJson, questionsJson, id, standard, date]
        );
        updated += 1;
      } else {
        await conn.query(
          `INSERT INTO result
           (ID, NAME, TOTAL_QUESTION, CORRECT_ANSWER, WRONG_ANSWER, PERCENTAGE, PASSING_CRITERIA, STATUS, STANDARD, DATE, ANSWERS, QUESTIONS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, name, totalQuestion, correctAnswer, wrongAnswer, percentage, passingCriteria, status, standard, date, answersJson, questionsJson]
        );
        inserted += 1;
      }
    }

    await conn.commit();

    const [afterCountRows] = await conn.query('SELECT COUNT(*) AS c FROM result');

    console.log('IMPORT_SUMMARY_START');
    console.log(JSON.stringify({
      excelPath: excelPathArg,
      sheetName,
      totalRowsInExcel: rows.length,
      inserted,
      updated,
      skipped,
      placeholderQuestions,
      unmappedChoiceCount,
      resolvedNonNumericIds,
      missingQnoCount: missingQnos.size,
      missingQnoSample: Array.from(missingQnos).slice(0, 25),
      unresolvedRows: unresolvedRows.slice(0, 20),
      finalResultTableCount: afterCountRows[0].c
    }, null, 2));
    console.log('IMPORT_SUMMARY_END');
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    throw error;
  } finally {
    await conn.end();
  }
}

importResults().catch(err => {
  console.error('IMPORT_FAILED:', err.message);
  process.exit(1);
});
