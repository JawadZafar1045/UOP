const XLSX = require('xlsx');

const DEFAULT_MAX_QUESTIONS = parseInt(process.env.QUIZ_BULK_UPLOAD_MAX_QUESTIONS, 10) || 100;

/**
 * Normalizes a header string for flexible matching
 * e.g. "Option A", "option_a", "OptionA", "Option (A)" -> "optiona"
 */
const normalizeHeader = (header) => {
  if (!header || typeof header !== 'string') return '';
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Generates an Excel workbook buffer with sample quiz questions
 */
const generateQuizTemplate = () => {
  const headers = [
    'Question',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer',
    'Answer Explanation',
    'Marks'
  ];

  const sampleRows = [
    [
      'What is the primary purpose of an index in a database?',
      'To back up the database securely',
      'To speed up data retrieval operations',
      'To encrypt sensitive user passwords',
      'To automatically normalize tables',
      'B',
      'Indexes create an efficient lookup data structure (like B-Trees) to accelerate queries.',
      1
    ],
    [
      'Which HTTP status code signifies that a requested resource was not found on the server?',
      '200',
      '401',
      '403',
      '404',
      'D',
      'HTTP 404 Not Found indicates that the server cannot find the requested resource.',
      1
    ],
    [
      'What is the time complexity of binary search on a sorted array of N elements?',
      'O(1)',
      'O(log N)',
      'O(N)',
      'O(N log N)',
      'B',
      'Binary search halves the search space at each step, yielding logarithmic time complexity O(log N).',
      2
    ],
    [
      'Which CSS property is used to create space around elements, outside of any defined borders?',
      'padding',
      'border-spacing',
      'margin',
      'outline-offset',
      'C',
      'Margin defines the space outside of the border, whereas padding defines the space inside the border.',
      1
    ],
    [
      'In JavaScript, which keyword is used to declare a variable that cannot be reassigned?',
      'var',
      'let',
      'const',
      'static',
      'C',
      'Variables declared with const create block-scoped, read-only references.',
      1
    ]
  ];

  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for great usability
  worksheet['!cols'] = [
    { wch: 45 }, // Question
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 16 }, // Correct Answer
    { wch: 45 }, // Answer Explanation
    { wch: 10 }, // Marks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Questions');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Parses and validates an uploaded Excel file buffer
 * @param {Buffer} buffer - Excel file buffer
 * @param {Object} [options] - Options including maxQuestions
 * @returns {Object} Validation report with parsed questions and error details
 */
const parseAndValidateQuizExcel = (buffer, options = {}) => {
  const maxQuestions = options.maxQuestions || DEFAULT_MAX_QUESTIONS;
  const globalErrors = [];
  const parsedQuestions = [];

  if (!buffer || !Buffer.isBuffer(buffer)) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: ['No valid Excel file provided.'],
      questions: []
    };
  }

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: ['Could not read Excel file. Please ensure the file is a valid .xlsx or .xls spreadsheet.'],
      questions: []
    };
  }

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: ['The uploaded workbook contains no sheets.'],
      questions: []
    };
  }

  const sheet = workbook.Sheets[sheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: ['The Excel worksheet is empty.'],
      questions: []
    };
  }

  // Identify Header Row (find the first row with recognizable headers)
  let headerRowIndex = -1;
  let headerMap = {};

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const currentMap = {};
    row.forEach((cell, colIdx) => {
      const norm = normalizeHeader(String(cell));
      if (!norm) return;

      if (['question', 'q', 'questiontext', 'questions'].includes(norm)) {
        currentMap.question = colIdx;
      } else if (['optiona', 'a', 'choicea', 'choice1', 'option1'].includes(norm)) {
        currentMap.optionA = colIdx;
      } else if (['optionb', 'b', 'choiceb', 'choice2', 'option2'].includes(norm)) {
        currentMap.optionB = colIdx;
      } else if (['optionc', 'c', 'choicec', 'choice3', 'option3'].includes(norm)) {
        currentMap.optionC = colIdx;
      } else if (['optiond', 'd', 'choiced', 'choice4', 'option4'].includes(norm)) {
        currentMap.optionD = colIdx;
      } else if (['correctanswer', 'answer', 'correctoption', 'correct', 'ans'].includes(norm)) {
        currentMap.correctAnswer = colIdx;
      } else if (['answerexplanation', 'explanation', 'explain', 'rationale', 'feedback'].includes(norm)) {
        currentMap.explanation = colIdx;
      } else if (['marks', 'mark', 'points', 'score', 'weight'].includes(norm)) {
        currentMap.marks = colIdx;
      }
    });

    // Check if essential headers are present
    if (
      currentMap.question !== undefined &&
      currentMap.optionA !== undefined &&
      currentMap.optionB !== undefined &&
      currentMap.correctAnswer !== undefined
    ) {
      headerRowIndex = r;
      headerMap = currentMap;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: [
        'Invalid or missing column headers. Please use the template with columns: Question, Option A, Option B, Option C, Option D, Correct Answer, Answer Explanation, Marks.'
      ],
      questions: []
    };
  }

  // Ensure all 4 options headers are present
  const missingHeaders = [];
  if (headerMap.question === undefined) missingHeaders.push('Question');
  if (headerMap.optionA === undefined) missingHeaders.push('Option A');
  if (headerMap.optionB === undefined) missingHeaders.push('Option B');
  if (headerMap.optionC === undefined) missingHeaders.push('Option C');
  if (headerMap.optionD === undefined) missingHeaders.push('Option D');
  if (headerMap.correctAnswer === undefined) missingHeaders.push('Correct Answer');

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: [`Missing required column headers: ${missingHeaders.join(', ')}`],
      questions: []
    };
  }

  // Data rows start after header row
  const rawDataRows = rows.slice(headerRowIndex + 1);

  // Filter out completely blank rows
  const validDataRows = [];
  rawDataRows.forEach((row, idx) => {
    const actualExcelRowNum = headerRowIndex + 1 + idx + 1; // 1-indexed Excel row
    if (!Array.isArray(row)) return;
    const hasAnyContent = row.some(cell => String(cell || '').trim() !== '');
    if (hasAnyContent) {
      validDataRows.push({ row, rowNumber: actualExcelRowNum });
    }
  });

  if (validDataRows.length === 0) {
    return {
      isValid: false,
      totalQuestions: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      maxAllowedQuestions: maxQuestions,
      globalErrors: ['The Excel worksheet contains headers but has no question data rows.'],
      questions: []
    };
  }

  // Question count limit check
  if (validDataRows.length > maxQuestions) {
    globalErrors.push(
      `File contains ${validDataRows.length} questions, which exceeds the maximum limit of ${maxQuestions} MCQs per upload.`
    );
  }

  // Duplicate question detection map (normalizedQuestion -> firstRowNumber)
  const questionMap = new Map();

  // Validate each question row
  validDataRows.forEach(({ row, rowNumber }) => {
    const rowErrors = [];

    // 1. Question text
    const rawQuestion = row[headerMap.question];
    const questionText = typeof rawQuestion === 'string' ? rawQuestion.trim() : String(rawQuestion || '').trim();

    if (!questionText) {
      rowErrors.push('Question text is required.');
    } else if (questionText.length > 2000) {
      rowErrors.push('Question text exceeds 2000 characters limit.');
    } else {
      const normalizedQ = questionText.toLowerCase().replace(/\s+/g, ' ');
      if (questionMap.has(normalizedQ)) {
        rowErrors.push(`Duplicate question: identical question found on Row ${questionMap.get(normalizedQ)}.`);
      } else {
        questionMap.set(normalizedQ, rowNumber);
      }
    }

    // 2. Options A, B, C, D
    const getOption = (colIdx) => {
      if (colIdx === undefined) return '';
      const val = row[colIdx];
      return typeof val === 'string' ? val.trim() : String(val !== undefined && val !== null ? val : '').trim();
    };

    const optA = getOption(headerMap.optionA);
    const optB = getOption(headerMap.optionB);
    const optC = getOption(headerMap.optionC);
    const optD = getOption(headerMap.optionD);

    if (!optA) rowErrors.push('Option A is required and cannot be empty.');
    if (!optB) rowErrors.push('Option B is required and cannot be empty.');
    if (!optC) rowErrors.push('Option C is required and cannot be empty.');
    if (!optD) rowErrors.push('Option D is required and cannot be empty.');

    // Check duplicate options within question
    const filledOptions = [optA, optB, optC, optD].filter(Boolean);
    const lowerOptions = filledOptions.map(o => o.toLowerCase());
    const uniqueOptions = new Set(lowerOptions);
    if (filledOptions.length === 4 && uniqueOptions.size < 4) {
      rowErrors.push('Duplicate options detected: all 4 choices must be distinct.');
    }

    // 3. Correct Answer
    const rawAns = row[headerMap.correctAnswer];
    const ansString = String(rawAns !== undefined && rawAns !== null ? rawAns : '').trim().toUpperCase();

    let correctIndex = -1;
    let normalizedAnswer = '';

    if (!ansString) {
      rowErrors.push('Correct Answer is required (must be A, B, C, or D).');
    } else if (ansString === 'A' || ansString === 'OPTION A' || ansString === 'OPTION 1' || ansString === '1') {
      correctIndex = 0;
      normalizedAnswer = 'A';
    } else if (ansString === 'B' || ansString === 'OPTION B' || ansString === 'OPTION 2' || ansString === '2') {
      correctIndex = 1;
      normalizedAnswer = 'B';
    } else if (ansString === 'C' || ansString === 'OPTION C' || ansString === 'OPTION 3' || ansString === '3') {
      correctIndex = 2;
      normalizedAnswer = 'C';
    } else if (ansString === 'D' || ansString === 'OPTION D' || ansString === 'OPTION 4' || ansString === '4') {
      correctIndex = 3;
      normalizedAnswer = 'D';
    } else {
      rowErrors.push(`Invalid Correct Answer "${ansString}". Must be A, B, C, or D.`);
    }

    // 4. Marks
    const rawMarks = headerMap.marks !== undefined ? row[headerMap.marks] : '';
    let marks = 1;
    if (rawMarks !== '' && rawMarks !== undefined && rawMarks !== null) {
      const parsedMarks = Number(rawMarks);
      if (isNaN(parsedMarks) || parsedMarks <= 0 || !Number.isInteger(parsedMarks)) {
        rowErrors.push(`Invalid Marks "${rawMarks}". Marks must be a positive whole number (e.g. 1, 2, 5).`);
      } else if (parsedMarks > 100) {
        rowErrors.push(`Marks (${parsedMarks}) exceeds the maximum allowed score of 100 per question.`);
      } else {
        marks = parsedMarks;
      }
    }

    // 5. Explanation
    const rawExplanation = headerMap.explanation !== undefined ? row[headerMap.explanation] : '';
    const explanation = typeof rawExplanation === 'string'
      ? rawExplanation.trim()
      : String(rawExplanation !== undefined && rawExplanation !== null ? rawExplanation : '').trim();

    parsedQuestions.push({
      rowNumber,
      question: questionText,
      options: [optA, optB, optC, optD],
      correctAnswer: normalizedAnswer,
      correctIndex,
      explanation,
      marks,
      errors: rowErrors,
      isValid: rowErrors.length === 0
    });
  });

  const errorCount = parsedQuestions.filter(q => !q.isValid).length;
  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const totalMarks = parsedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const isValid = globalErrors.length === 0 && errorCount === 0;

  return {
    isValid,
    totalQuestions: parsedQuestions.length,
    validCount,
    errorCount,
    totalMarks,
    maxAllowedQuestions: maxQuestions,
    globalErrors,
    questions: parsedQuestions
  };
};

module.exports = {
  generateQuizTemplate,
  parseAndValidateQuizExcel,
  DEFAULT_MAX_QUESTIONS
};
