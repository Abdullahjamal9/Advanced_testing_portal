// certificateGenerator.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'certificates', 'templates');
const GENERATED_DIR = path.join(__dirname, '..', 'certificates', 'generated');

// Template mapping
const TEMPLATE_MAP = {
  'Ds-1': 'Ds-1.pdf',
  'Cumulative': 'Cumulative.pdf',
  'API RP 7G-2': 'API_RP_7G-2.pdf',
  'API_RP_7G-2': 'API_RP_7G-2.pdf',
  'API SPEC 5CT & 5A5': 'API SPEC 5CT & 5A5.pdf',
  'API_SPEC_5CT_&_5A5': 'API_SPEC_5CT_5A5.pdf',
  'API_SPEC_5CT_5A5': 'API_SPEC_5CT_5A5.pdf',
  'MT': 'MPT.pdf',
  'PT': 'PT LEVEL II.pdf',
  'UT': 'UT LEVEL II.pdf',
  'VT': 'VT.pdf'
};

// Extract template type from standard name
function getTemplateType(standardName) {
  const standard = standardName.toUpperCase();
  
  if (standard.includes('API RP 7G-2') || standard.includes('API_RP_7G-2')) {
    return 'API RP 7G-2';
  } else if (standard.includes('API SPEC 5CT') || standard.includes('API_SPEC_5CT')) {
    return 'API SPEC 5CT & 5A5';
  } else if (standard.includes('DS-1')) {
    return 'Ds-1';
  } else if (standard.includes('CUMULATIVE')) {
    return 'Cumulative';
  } else if (standard.includes('MAGNETIC PARTICLE') || standard.includes('MPT')) {
    return 'MT';
  } else if (standard.includes('ULTRASONIC') || standard.includes('UT')) {
    return 'UT';
  } else if (standard.includes('VISUAL') || standard.includes('VT')) {
    return 'VT';
  } else if (standard.includes('PENETRANT TESTING') || standard.includes('PENETRANT') || standard.includes('PT')) {
    return 'PT';
  }
  
  return 'Ds-1'; // Default template
}

function getLayoutTemplateType({ standardName, templateType }) {
  const candidates = [templateType, standardName];

  for (const value of candidates) {
    const standard = String(value || '').toUpperCase();
    if (!standard) continue;

    if (standard.includes('MAGNETIC PARTICLE') || standard.includes('MPT')) {
      return 'MT';
    } else if (standard.includes('ULTRASONIC') || standard.includes('UT')) {
      return 'UT';
    } else if (standard.includes('VISUAL') || standard.includes('VT')) {
      return 'VT';
    } else if (standard.includes('PENETRANT TESTING') || standard.includes('PENETRANT') || standard.includes('PT')) {
      return 'PT';
    }
  }

  return getTemplateType(standardName || templateType || '');
}

function resolveTemplatePathFromType(templateType) {
  const raw = String(templateType || '').trim();
  if (!raw) return null;

  const rawExt = path.extname(raw).toLowerCase();
  const basePath = path.isAbsolute(raw) ? raw : path.join(TEMPLATES_DIR, raw);
  const candidatePath = rawExt === '.pdf' ? basePath : `${basePath}.pdf`;

  const resolvedPath = path.resolve(candidatePath);
  const safeRoot = path.resolve(TEMPLATES_DIR) + path.sep;
  if (!resolvedPath.startsWith(safeRoot)) return null;

  return resolvedPath;
}

// Get template path
function getTemplatePath(templateType) {
  const templateKey = String(templateType || '').trim();
  if (!templateKey) return null;

  const filename = TEMPLATE_MAP[templateKey];
  if (filename) {
    return path.join(TEMPLATES_DIR, filename);
  }

  return resolveTemplatePathFromType(templateKey);
}

function getCertificateTag(templatePath, templateType) {
  if (templatePath) {
    const baseName = path.parse(templatePath).name;
    return baseName.replace(/\s+/g, '_').toUpperCase();
  }

  const raw = String(templateType || 'Ds-1').trim();
  const baseName = path.parse(raw).name || raw;
  return baseName.replace(/\s+/g, '_').toUpperCase();
}

// Format date - keep simple format from frontend
function formatDate(dateStr) {
  try {
    // Just remove time portion if present
    const dateOnly = dateStr.split(' ')[0];
    return dateOnly;
  } catch (e) {
    return dateStr;
  }
}

// Calculate validity date (5 years minus 1 day from test date)
function getValidityDate(dateStr) {
  try {
    const dateOnly = dateStr.split(' ')[0];
    
    // Parse different date formats
    let date;
    if (dateOnly.includes('/')) {
      // Format: "9/7/2025" or "09/07/2025"
      const parts = dateOnly.split('/');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]); // year, month-1, day
      }
    } else if (dateOnly.includes('-')) {
      // Format: "27-01-2026" or "2026-01-27"
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        // Check which format it is
        if (parts[0].length === 4) {
          // Format: "2026-01-27" (YYYY-MM-DD)
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // Format: "27-01-2026" (DD-MM-YYYY)
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    }
    
    if (!date || isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Add 5 years, then subtract 1 day
    date.setFullYear(date.getFullYear() + 5);
    date.setDate(date.getDate() - 1);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return 'N/A';
  }
}

// Safe filename
function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

async function loadCambriaFont(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);

  const backendFontsDir = path.resolve(__dirname, '..', 'Fonts');
  const fontPaths = [
    path.join(backendFontsDir, 'cambriab.ttf'),
    path.join(backendFontsDir, 'CAMBRIAB.TTF'),
    path.join(backendFontsDir, 'cambria.ttc'),
    path.join(backendFontsDir, 'CAMBRIA.TTC'),
    path.join(backendFontsDir, 'cambria.ttf'),
    path.join(backendFontsDir, 'CAMBRIA.TTF'),
    // process.env.PTIS_CAMBRIA_HEADINGS_FONT_PATH,
    // path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'cambriab.ttf'),
    // path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'CAMBRIAB.TTF'),
    // process.env.PTIS_CAMBRIA_FONT_PATH,
    // path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'cambria.ttc'),
    // path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'CAMBRIA.TTC'),
    // path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'cambria.ttf'),
    // path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'CAMBRIA.TTF'),
    // path.join(__dirname, '..', 'Fonts', 'cambriab.ttf'),
    // path.join(__dirname, '..', 'Fonts', 'cambria.ttf')
  ].filter(Boolean);

  for (const fontPath of fontPaths) {
    try {
      await fs.access(fontPath);
      const bytes = await fs.readFile(fontPath);
      const font = await pdfDoc.embedFont(bytes, { subset: true });
      return { font, sourcePath: fontPath };
    } catch (err) {
      // Try next location until Cambria is found.
    }
  }

  return { font: null, sourcePath: null };
}

// Main certificate generation function
async function generateCertificate({
  emp_id,
  emp_name,
  test_date,
  status,
  standard,
  percentage,
  passing_criteria,
  // For 2-row certificates (PT/MPT)
  is_combined = false,
  general_data = null,
  specific_data = null,
  // For 3-row certificates (PT/MPT with Practical)
  practical_data = null,
  // For SINGLE-type standards that require a practical (single theory row +
  // practical row = 2-row certificate). Independent of the General/Specific
  // (3-row) flow above; uses its own positions defined below.
  is_single_with_practical = false,
  // Certification type
  certification_type = 'New',
  previous_certificate_no = null,
  // Custom template override
  certificate_template = null,
  // Manually-entered Vision Examination values (MT/MPT 3-row layout only)
  vision_data = null,
  // Passport-size photo to embed (top-right corner)
  photo_buffer = null,
  photo_mime = null
}) {
  try {
    // Ensure generated directory exists
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    
    // Determine template type
    console.log('Standard name received:', standard);
    
    const hasGeneralSpecificTag = (value) => {
      const lowered = String(value || '').toLowerCase();
      return lowered.includes('general') || lowered.includes('specific') || lowered.includes('practical');
    };
    // A single-type standard with a practical keeps its OWN template (custom or
    // default) — it must not fall into the General/Specific (MPT) layout even
    // though its practical_data.standard contains the word "Practical".
    const useGeneralSpecificTemplate =
      !is_single_with_practical && (
        (is_combined && general_data && specific_data) ||
        hasGeneralSpecificTag(standard) ||
        hasGeneralSpecificTag(general_data && general_data.standard) ||
        hasGeneralSpecificTag(specific_data && specific_data.standard) ||
        hasGeneralSpecificTag(practical_data && practical_data.standard)
      );
    const useDefaultTemplate = !certificate_template && !useGeneralSpecificTemplate;
    const useCustomTemplate = !!certificate_template;

    // Use custom template if provided, otherwise choose generalized or default
    let templateType;
    if (certificate_template) {
      templateType = certificate_template;
      console.log('Using custom template:', templateType);
    } else if (useGeneralSpecificTemplate) {
      templateType = 'MPT';
      console.log('Using generalized General/Specific template:', templateType);
    } else {
      templateType = 'Ds-1';
      console.log('Using default template:', templateType);
    }
    
    const templatePath = useCustomTemplate
      ? resolveTemplatePathFromType(certificate_template)
      : getTemplatePath(templateType);
    const layoutTemplateType = useGeneralSpecificTemplate
      ? 'MT'
      : (useDefaultTemplate
        ? templateType
        : getLayoutTemplateType({
          standardName: standard,
          templateType
        }));
    console.log('Template path:', templatePath);
    
    if (!templatePath) {
      throw new Error(`Template not found for: ${templateType}`);
    }
    
    // Check if template exists
    try {
      await fs.access(templatePath);
    } catch (e) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    // Load the PDF template
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Get first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Load fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const cambriaHeadingsResult = await loadCambriaFont(pdfDoc);
    const cambriaHeadingsFont = cambriaHeadingsResult.font;
    const certificateNameFont = cambriaHeadingsFont || timesRomanBold;
    const certificateTableFont = cambriaHeadingsFont || timesRomanFont;

    if (!cambriaHeadingsFont) {
      console.warn('Cambria (Headings) font not found. Falling back to Times Roman fonts for certificate name/table.');
    } else {
      console.log(`Using Cambria (Headings) font from: ${cambriaHeadingsResult.sourcePath}`);
    }
    
    // Remove time from date (keep only date part)
    const formattedDate = test_date ? formatDate(test_date) : '';
    const validityDate = test_date ? getValidityDate(test_date) : 'N/A';
    
    // Extract year from test date
    let certYear = '2026'; // default
    if (test_date) {
      try {
        const dateOnly = test_date.split(' ')[0];
        if (dateOnly.includes('/')) {
          const parts = dateOnly.split('/');
          if (parts.length === 3) certYear = parts[2]; // DD/MM/YYYY
        } else if (dateOnly.includes('-')) {
          const parts = dateOnly.split('-');
          if (parts.length === 3) {
            certYear = parts[0].length === 4 ? parts[0] : parts[2]; // YYYY-MM-DD or DD-MM-YYYY
          }
        }
      } catch (e) {
        certYear = '2026';
      }
    }
    
    // Certificate number format: {emp_id}/PTIS/{cert_tag}/{year}
    const certTagTemplateType = certificate_template
      ? certificate_template
      : useGeneralSpecificTemplate
        ? templateType
        : (is_combined && general_data && general_data.standard)
          ? getTemplateType(general_data.standard)
          : (is_combined && specific_data && specific_data.standard)
            ? getTemplateType(specific_data.standard)
            : templateType;
    const certTagTemplatePath = certificate_template
      ? resolveTemplatePathFromType(certificate_template)
      : getTemplatePath(certTagTemplateType);
    const certTag = getCertificateTag(certTagTemplatePath, certTagTemplateType);
    const certificateNumber = `${emp_id}/PTIS/${certTag}/${certYear}`;
    
    // No Mr./Mrs./Ms. prefix - just the plain employee name
    const displayName = String(emp_name || '').replace(/^(Mr|Mrs|Ms)\.?\s*/i, '').trim();

    // Draw employee name (above "For" - centered, Cambria and non-italic)
    let nameSize = 24;
    let nameWidth = certificateNameFont.widthOfTextAtSize(displayName, nameSize);
    const maxNameWidth = width * 0.72;
    while (nameWidth > maxNameWidth && nameSize > 16) {
      nameSize -= 1;
      nameWidth = certificateNameFont.widthOfTextAtSize(displayName, nameSize);
    }
    const nameX = (width - nameWidth) / 2;

    // The name + ID block sits between "Certificate of Accomplishment
    // Awarded to" and "For", centered so top/bottom padding matches - but
    // those two lines sit at different Y per template artwork, so each
    // calibrated template gets its own entry here. Falls back to the MPT
    // calibration for any template not yet measured.
    const NAME_ID_POSITIONS = {
      'MPT': { nameY: 434, empIdY: 404 },               // Awarded to y=464, For y=379
      'API_RP': { nameY: 416, empIdY: 385 },             // Awarded to y=446, For y=359
      'API_RP_7G-2': { nameY: 416, empIdY: 385 }         // Awarded to y=446, For y=359
    };
    const templateBaseName = path.parse(templatePath).name;
    const namePos = NAME_ID_POSITIONS[templateBaseName] || NAME_ID_POSITIONS['MPT'];
    const nameY = namePos.nameY;

    // Employee ID - bold line below the name.
    const empIdSize = 14;
    const empIdText = `EMP ID: ${emp_id}`;
    const empIdWidth = timesRomanBold.widthOfTextAtSize(empIdText, empIdSize);
    const empIdX = (width - empIdWidth) / 2;
    const empIdY = namePos.empIdY;

    const formatExamStandardLabel = (value) => {
      const raw = String(value || '').trim();
      if (!raw) return '';
      const lower = raw.toLowerCase();
      if (lower.includes('general')) return 'General Theory';
      if (lower.includes('specific')) return 'Specific Theory';
      if (lower.includes('practical')) return 'Practical';
      return raw;
    };
    
    firstPage.drawText(displayName, {
      x: nameX,
      y: nameY,
      size: nameSize,
      font: certificateNameFont,
      color: rgb(0, 0, 0)
    });

    firstPage.drawText(empIdText, {
      x: empIdX,
      y: empIdY,
      size: empIdSize,
      font: timesRomanBold,
      color: rgb(0, 0, 0)
    });

    // Check if this is a 2-row or 3-row certificate (PT/MPT with General + Specific + optional Practical)
    if (is_combined && general_data && specific_data) {
      // Column center positions - measured off the MPT.pdf artwork's
      // "Examination / Achieved Percentage / Passing Criteria" header
      // (the table was narrowed to make room for the Vision Examination
      // table on the right).
      const col1Center = 170;
      const col2Center = 320;
      const col3Center = 444;

      if (practical_data) {
        // 4-row table (General + Specific + Practical + Average). Row
        // Y-positions are measured directly off the template's row grid
        // (same grid the Vision Examination table's 4 rows use).
        const tableY1 = 258; // First row (General)
        const tableY2 = 243; // Second row (Specific)
        const tableY3 = 228;  // Third row (Practical)
        
        // Row 1 - General
        const gen_standardText = formatExamStandardLabel(general_data.standard);
        const gen_standardWidth = certificateTableFont.widthOfTextAtSize(gen_standardText, 11);
        firstPage.drawText(gen_standardText, {
          x: col1Center - (gen_standardWidth / 2),
          y: tableY1,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });
        
        if (general_data.percentage && !isNaN(general_data.percentage)) {
          const gen_achievedText = `${general_data.percentage}%`;
          const gen_achievedWidth = certificateTableFont.widthOfTextAtSize(gen_achievedText, 11);
          firstPage.drawText(gen_achievedText, {
            x: col2Center - (gen_achievedWidth / 2),
            y: tableY1,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (general_data.passing_criteria && !isNaN(general_data.passing_criteria)) {
          const gen_criteriaText = `${general_data.passing_criteria}%`;
          const gen_criteriaWidth = certificateTableFont.widthOfTextAtSize(gen_criteriaText, 11);
          firstPage.drawText(gen_criteriaText, {
            x: col3Center - (gen_criteriaWidth / 2),
            y: tableY1,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Row 2 - Specific
        const spec_standardText = formatExamStandardLabel(specific_data.standard);
        const spec_standardWidth = certificateTableFont.widthOfTextAtSize(spec_standardText, 11);
        firstPage.drawText(spec_standardText, {
          x: col1Center - (spec_standardWidth / 2),
          y: tableY2,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });
        
        if (specific_data.percentage && !isNaN(specific_data.percentage)) {
          const spec_achievedText = `${specific_data.percentage}%`;
          const spec_achievedWidth = certificateTableFont.widthOfTextAtSize(spec_achievedText, 11);
          firstPage.drawText(spec_achievedText, {
            x: col2Center - (spec_achievedWidth / 2),
            y: tableY2,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (specific_data.passing_criteria && !isNaN(specific_data.passing_criteria)) {
          const spec_criteriaText = `${specific_data.passing_criteria}%`;
          const spec_criteriaWidth = certificateTableFont.widthOfTextAtSize(spec_criteriaText, 11);
          firstPage.drawText(spec_criteriaText, {
            x: col3Center - (spec_criteriaWidth / 2),
            y: tableY2,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Row 3 - Practical
        const prac_standardText = formatExamStandardLabel(practical_data.standard);
        const prac_standardWidth = certificateTableFont.widthOfTextAtSize(prac_standardText, 11);
        firstPage.drawText(prac_standardText, {
          x: col1Center - (prac_standardWidth / 2),
          y: tableY3,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });
        
        if (practical_data.percentage && !isNaN(practical_data.percentage)) {
          const prac_achievedText = `${practical_data.percentage}%`;
          const prac_achievedWidth = certificateTableFont.widthOfTextAtSize(prac_achievedText, 11);
          firstPage.drawText(prac_achievedText, {
            x: col2Center - (prac_achievedWidth / 2),
            y: tableY3,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (practical_data.passing_criteria && !isNaN(practical_data.passing_criteria)) {
          const prac_criteriaText = `${practical_data.passing_criteria}%`;
          const prac_criteriaWidth = certificateTableFont.widthOfTextAtSize(prac_criteriaText, 11);
          firstPage.drawText(prac_criteriaText, {
            x: col3Center - (prac_criteriaWidth / 2),
            y: tableY3,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }

        // Row 4 - Average (General + Specific + Practical achieved %)
        const tableY4 = 213; // same row grid, aligned with the Vision "Education" row
        const avgInputs = [general_data.percentage, specific_data.percentage, practical_data.percentage]
          .map((v) => parseFloat(v))
          .filter((v) => !isNaN(v));

        const avg_standardText = 'Average';
        const avg_standardWidth = certificateTableFont.widthOfTextAtSize(avg_standardText, 11);
        firstPage.drawText(avg_standardText, {
          x: col1Center - (avg_standardWidth / 2),
          y: tableY4,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });

        if (avgInputs.length > 0) {
          const avgValue = avgInputs.reduce((sum, v) => sum + v, 0) / avgInputs.length;
          const avg_achievedText = `${avgValue.toFixed(2)}%`;
          const avg_achievedWidth = certificateTableFont.widthOfTextAtSize(avg_achievedText, 11);
          firstPage.drawText(avg_achievedText, {
            x: col2Center - (avg_achievedWidth / 2),
            y: tableY4,
            size: 11,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }

        // Fixed overall passing criteria for the Average row
        const avg_criteriaText = '75%';
        const avg_criteriaWidth = certificateTableFont.widthOfTextAtSize(avg_criteriaText, 11);
        firstPage.drawText(avg_criteriaText, {
          x: col3Center - (avg_criteriaWidth / 2),
          y: tableY4,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });

        // Vision Examination table (right side of the page) - values are
        // manually entered by the admin, not derived from test data.
        // Row Y-positions measured directly off the "Near Vision" / "Color
        // Vision" / "Training Hours" / "Education" labels baked into the
        // artwork; the value sits in the empty cell to their right.
        if (vision_data) {
          // Center of the value column - matches where "Near Vision"'s value
          // (e.g. "OK") already sits correctly; all rows expand left/right
          // from this same center so different text lengths stay aligned.
          const VISION_COL_CENTER = 667;
          const VISION_ROW_Y_1 = 258;   // Near Vision
          const VISION_ROW_Y_2 = 243;   // Color Vision
          const VISION_ROW_Y_3 = 228;  // Training Hours
          const VISION_ROW_Y_4 = 213;  // Education
          const VISION_FONT_SIZE = 10;

          const drawVisionValue = (text, y) => {
            const trimmed = String(text || '').trim();
            if (!trimmed) return;
            const textWidth = certificateTableFont.widthOfTextAtSize(trimmed, VISION_FONT_SIZE);
            firstPage.drawText(trimmed, {
              x: VISION_COL_CENTER - (textWidth / 2),
              y,
              size: VISION_FONT_SIZE,
              font: certificateTableFont,
              color: rgb(0, 0, 0)
            });
          };

          drawVisionValue(vision_data.near_vision, VISION_ROW_Y_1);
          drawVisionValue(vision_data.color_vision, VISION_ROW_Y_2);
          drawVisionValue(vision_data.training_hours, VISION_ROW_Y_3);
          drawVisionValue(vision_data.education, VISION_ROW_Y_4);
        }
      }
      /* COMMENTED OUT - 2-row table
      else {
        // 2-row table (General + Specific only)
        const tableY1 = height * 0.38 + 25; // First row (General)
        const tableY2 = height * 0.38 + 10; // Second row (Specific)
        
        // Row 1 - General
        const gen_standardText = general_data.standard;
        const gen_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(gen_standardText, 11);
        firstPage.drawText(gen_standardText, {
          x: col1Center - (gen_standardWidth / 2),
          y: tableY1,
          size: 11,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (general_data.percentage && !isNaN(general_data.percentage)) {
          const gen_achievedText = `${general_data.percentage}%`;
          const gen_achievedWidth = timesRomanFont.widthOfTextAtSize(gen_achievedText, 11);
          firstPage.drawText(gen_achievedText, {
            x: col2Center - (gen_achievedWidth / 2),
            y: tableY1,
            size: 11,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (general_data.passing_criteria && !isNaN(general_data.passing_criteria)) {
          const gen_criteriaText = `${general_data.passing_criteria}%`;
          const gen_criteriaWidth = timesRomanFont.widthOfTextAtSize(gen_criteriaText, 11);
          firstPage.drawText(gen_criteriaText, {
            x: col3Center - (gen_criteriaWidth / 2),
            y: tableY1,
            size: 11,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Row 2 - Specific
        const spec_standardText = specific_data.standard;
        const spec_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(spec_standardText, 11);
        firstPage.drawText(spec_standardText, {
          x: col1Center - (spec_standardWidth / 2),
          y: tableY2,
          size: 11,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (specific_data.percentage && !isNaN(specific_data.percentage)) {
          const spec_achievedText = `${specific_data.percentage}%`;
          const spec_achievedWidth = timesRomanFont.widthOfTextAtSize(spec_achievedText, 11);
          firstPage.drawText(spec_achievedText, {
            x: col2Center - (spec_achievedWidth / 2),
            y: tableY2,
            size: 11,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (specific_data.passing_criteria && !isNaN(specific_data.passing_criteria)) {
          const spec_criteriaText = `${specific_data.passing_criteria}%`;
          const spec_criteriaWidth = timesRomanFont.widthOfTextAtSize(spec_criteriaText, 11);
          firstPage.drawText(spec_criteriaText, {
            x: col3Center - (spec_criteriaWidth / 2),
            y: tableY2,
            size: 11,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
      }
      */
    } else if (is_single_with_practical && practical_data) {
      /* ================================================================ */
      /* SINGLE-STANDARD + PRACTICAL (2-row) certificate layout.          */
      /* Row 1 = theory (the single standard), Row 2 = practical.         */
      /* These positions are defined HERE on their own so they can be     */
      /* adjusted without disturbing the single-row or 3-row layouts.     */
      /* ================================================================ */
      const SP_COL1_CENTER = 181;   // Standard / exam-name column center
      const SP_COL2_CENTER = 412;   // Achieved (%) column center
      const SP_COL3_CENTER = 650;   // Passing criteria (%) column center
      const SP_FONT_SIZE = 11;      // Row text size
      // Row Y-positions measured directly off the "Standard / Achieved
      // Percentage / Passing Criteria" header (y=266) baked into the
      // API_RP.pdf artwork.
      const SP_THEORY_ROW_Y = 251;    // Row 1 (theory) baseline
      const SP_PRACTICAL_ROW_Y = 236; // Row 2 (practical) baseline

      const drawSinglePracticalRow = (rowY, label, pct, criteria) => {
        const labelWidth = certificateTableFont.widthOfTextAtSize(label, SP_FONT_SIZE);
        firstPage.drawText(label, {
          x: SP_COL1_CENTER - (labelWidth / 2),
          y: rowY,
          size: SP_FONT_SIZE,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });

        if (pct != null && !isNaN(pct)) {
          const achievedText = `${pct}%`;
          const achievedWidth = certificateTableFont.widthOfTextAtSize(achievedText, SP_FONT_SIZE);
          firstPage.drawText(achievedText, {
            x: SP_COL2_CENTER - (achievedWidth / 2),
            y: rowY,
            size: SP_FONT_SIZE,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }

        if (criteria != null && !isNaN(criteria)) {
          const criteriaText = `${criteria}%`;
          const criteriaWidth = certificateTableFont.widthOfTextAtSize(criteriaText, SP_FONT_SIZE);
          firstPage.drawText(criteriaText, {
            x: SP_COL3_CENTER - (criteriaWidth / 2),
            y: rowY,
            size: SP_FONT_SIZE,
            font: certificateTableFont,
            color: rgb(0, 0, 0)
          });
        }
      };

      // Row 1 — theory result. The Standard column always reads "Theory".
      drawSinglePracticalRow(SP_THEORY_ROW_Y, 'Theory', percentage, passing_criteria);
      // Row 2 — practical result. The Standard column always reads "Practical".
      drawSinglePracticalRow(SP_PRACTICAL_ROW_Y, 'Practical', practical_data.percentage, practical_data.passing_criteria);
    } else {
      // Single row table - Y measured directly off the "Standard / Achieved
      // Percentage / Passing Criteria" header (y=266) baked into the
      // API_RP_7G-2.pdf artwork.
      const tableY = 251;
      const col1Center = 181;
      const col2Center = 412;
      const col3Center = 650;
      
      const standardText = standard;
      const standardWidth = certificateTableFont.widthOfTextAtSize(standardText, 9);
      firstPage.drawText(standardText, {
        x: col1Center - (standardWidth / 2),
        y: tableY,
        size: 11,
        font: certificateTableFont,
        color: rgb(0, 0, 0)
      });
      
      if (percentage && !isNaN(percentage)) {
        const achievedText = `${percentage}%`;
        const achievedWidth = certificateTableFont.widthOfTextAtSize(achievedText, 9);
        firstPage.drawText(achievedText, {
          x: col2Center - (achievedWidth / 2),
          y: tableY,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });
      }
      
      if (passing_criteria && !isNaN(passing_criteria)) {
        const criteriaText = `${passing_criteria}%`;
        const criteriaWidth = certificateTableFont.widthOfTextAtSize(criteriaText, 9);
        firstPage.drawText(criteriaText, {
          x: col3Center - (criteriaWidth / 2),
          y: tableY,
          size: 11,
          font: certificateTableFont,
          color: rgb(0, 0, 0)
        });
      }
    }
    
    // For PT/MPT/UT/VT templates, add date of certification and validity
    if (layoutTemplateType === 'PT' || layoutTemplateType === 'MT' || layoutTemplateType === 'UT' || layoutTemplateType === 'VT') {
      // Certificate number
      firstPage.drawText(certificateNumber, {
        x: 200,
        y: 58,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
      
      // Date of Certification or Re-Certification (below table, left side)
      const certDateLabel = certification_type === 'Recertification' ? 'Date of Re-Certification' : 'Date of Certification';
      const dateOfCertText = `${certDateLabel}: ${formattedDate}`;
      firstPage.drawText(dateOfCertText, {
        x: 54,
        y: 181,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });

      if (certification_type === 'Recertification') {
        const previousCertNoText = `Previous Certificate No.: ${String(previous_certificate_no || '').trim() || 'N/A'}`;
        firstPage.drawText(previousCertNoText, {
          x: 54,
          y: 165,
          size: 13,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        });
      }
      
      // Validity (below table, right side)
      const validityText = `Validity: ${validityDate}`;
      const validityWidth = timesRomanFont.widthOfTextAtSize(validityText, 15);
      firstPage.drawText(validityText, {
        x: width - validityWidth - 44,
        y: 181,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
      
      // Examiner DATE (bottom right corner)
      firstPage.drawText(formattedDate, {
        x: 675,
        y: 58,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
    } else {
      // Standard templates - Y measured directly off the "CERTIFICATE NO:" /
      // "DATE:" labels (both at y=96) baked into the API_RP.pdf /
      // API_RP_7G-2.pdf artwork.
      const certNumSize = 13;
      firstPage.drawText(certificateNumber, {
        x: 194,
        y: 96,
        size: certNumSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });

      const dateSize = 13;
      firstPage.drawText(formattedDate, {
        x: 669,
        y: 96,
        size: dateSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
    }

    // Passport-size photo (top-right corner). Skipped silently if none was
    // uploaded. Coordinates are calibration-pending against the artwork.
    if (photo_buffer) {
      try {
        const isPng = String(photo_mime || '').toLowerCase().includes('png');
        const embeddedPhoto = isPng
          ? await pdfDoc.embedPng(photo_buffer)
          : await pdfDoc.embedJpg(photo_buffer);

        const PHOTO_WIDTH = 105;
        const PHOTO_HEIGHT = 110;
        const PHOTO_X = width - PHOTO_WIDTH - 50;
        // Default (MPT) Y sits just under the header. On API_RP, the photo's
        // top edge lines up with the "STANDARD AWARENESS TRAINING PROGRAM"
        // subtitle (y=475).
        const PHOTO_Y_BY_TEMPLATE = {
          'API_RP': 475 - PHOTO_HEIGHT,
          'API_RP_7G-2': 475 - PHOTO_HEIGHT
        };
        const PHOTO_Y = PHOTO_Y_BY_TEMPLATE[templateBaseName] ?? (height - PHOTO_HEIGHT - 55);

        firstPage.drawImage(embeddedPhoto, {
          x: PHOTO_X,
          y: PHOTO_Y,
          width: PHOTO_WIDTH,
          height: PHOTO_HEIGHT
        });

        // Border frame around the photo - applies to every template.
        firstPage.drawRectangle({
          x: PHOTO_X,
          y: PHOTO_Y,
          width: PHOTO_WIDTH,
          height: PHOTO_HEIGHT,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1.5
        });
      } catch (photoErr) {
        console.warn('Certificate photo embed failed, continuing without it:', photoErr.message);
      }
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();
    
    // Generate filename
    const safeName = sanitizeFilename(emp_name);
    const safeStandard = sanitizeFilename(templateType);
    const filename = `${safeStandard}_Certificate_${emp_id}_${safeName}.pdf`;
    const outputPath = path.join(GENERATED_DIR, filename);
    
    // Write to file
    await fs.writeFile(outputPath, pdfBytes);
    
    console.log(`Certificate generated: ${filename}`);
    
    return {
      success: true,
      filename,
      path: outputPath,
      certificateNumber
    };
    
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw error;
  }
}

module.exports = { generateCertificate };
