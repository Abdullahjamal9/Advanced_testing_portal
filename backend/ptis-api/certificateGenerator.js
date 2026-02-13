// certificateGenerator.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
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
  'API SPEC 5CT & 5A5': 'API_SPEC_5CT_&_5A5.pdf',
  'API_SPEC_5CT_&_5A5': 'API_SPEC_5CT_&_5A5.pdf',
  'MT': 'MT.pdf',
  'PT': 'PT.pdf',
  'UT': 'UT.pdf',
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

// Get template path
function getTemplatePath(templateType) {
  const filename = TEMPLATE_MAP[templateType];
  if (!filename) return null;
  
  const templatePath = path.join(TEMPLATES_DIR, filename);
  return templatePath;
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

// Calculate validity date (5 years from test date)
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
    
    // Add 5 years
    date.setFullYear(date.getFullYear() + 5);
    
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
  // Certification type
  certification_type = 'New',
  // Custom template override
  certificate_template = null
}) {
  try {
    // Ensure generated directory exists
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    
    // Determine template type
    console.log('Standard name received:', standard);
    
    // Use custom template if provided, otherwise auto-detect
    let templateType;
    if (certificate_template) {
      templateType = certificate_template;
      console.log('Using custom template:', templateType);
    } else {
      templateType = getTemplateType(standard);
      console.log('Auto-detected template type:', templateType);
    }
    
    const templatePath = getTemplatePath(templateType);
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
    const timesRomanBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
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
    let certTag = templateType.replace(/\s+/g, '_').toUpperCase();
    if (templateType === 'PT') certTag = 'PT';
    else if (templateType === 'MT') certTag = 'MPT';
    else if (templateType === 'UT') certTag = 'UT LEVEL II';
    // else if (templateType === 'VT') certTag = 'VT';
    const certificateNumber = `${emp_id}/PTIS/${certTag}/${certYear}`;
    
    // Remove "Mr" prefix from employee name
    const cleanedName = emp_name.replace(/^Mr\.?\s*/i, '').trim();
    
    // Draw employee name (above "For" - centered, bold italic)
    const nameSize = 18;
    const nameWidth = timesRomanBoldItalic.widthOfTextAtSize(cleanedName, nameSize);
    const nameX = (width - nameWidth) / 2;
    const nameY = height * 0.70; // Slightly higher to create gap with "For"
    
    firstPage.drawText(cleanedName, {
      x: nameX,
      y: nameY,
      size: nameSize,
      font: timesRomanBoldItalic,
      color: rgb(0, 0, 0)
    });
    
    // Check if this is a 2-row or 3-row certificate (PT/MPT with General + Specific + optional Practical)
    if (is_combined && general_data && specific_data) {
      // Column center positions
      const col1Center = 182;
      const col2Center = 412;
      const col3Center = 650;
      
      if (practical_data) {
        // 3-row table (General + Specific + Practical)
        const tableY1 = height * 0.38 + 25; // First row (General)
        const tableY2 = height * 0.38 + 10; // Second row (Specific)
        const tableY3 = height * 0.38 - 5;  // Third row (Practical)
        
        // Row 1 - General
        const gen_standardText = general_data.standard;
        const gen_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(gen_standardText, 12);
        firstPage.drawText(gen_standardText, {
          x: col1Center - (gen_standardWidth / 2),
          y: tableY1,
          size: 12,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (general_data.percentage && !isNaN(general_data.percentage)) {
          const gen_achievedText = `${general_data.percentage}%`;
          const gen_achievedWidth = timesRomanFont.widthOfTextAtSize(gen_achievedText, 12);
          firstPage.drawText(gen_achievedText, {
            x: col2Center - (gen_achievedWidth / 2),
            y: tableY1,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (general_data.passing_criteria && !isNaN(general_data.passing_criteria)) {
          const gen_criteriaText = `${general_data.passing_criteria}%`;
          const gen_criteriaWidth = timesRomanFont.widthOfTextAtSize(gen_criteriaText, 12);
          firstPage.drawText(gen_criteriaText, {
            x: col3Center - (gen_criteriaWidth / 2),
            y: tableY1,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Row 2 - Specific
        const spec_standardText = specific_data.standard;
        const spec_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(spec_standardText, 12);
        firstPage.drawText(spec_standardText, {
          x: col1Center - (spec_standardWidth / 2),
          y: tableY2,
          size: 12,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (specific_data.percentage && !isNaN(specific_data.percentage)) {
          const spec_achievedText = `${specific_data.percentage}%`;
          const spec_achievedWidth = timesRomanFont.widthOfTextAtSize(spec_achievedText, 12);
          firstPage.drawText(spec_achievedText, {
            x: col2Center - (spec_achievedWidth / 2),
            y: tableY2,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (specific_data.passing_criteria && !isNaN(specific_data.passing_criteria)) {
          const spec_criteriaText = `${specific_data.passing_criteria}%`;
          const spec_criteriaWidth = timesRomanFont.widthOfTextAtSize(spec_criteriaText, 12);
          firstPage.drawText(spec_criteriaText, {
            x: col3Center - (spec_criteriaWidth / 2),
            y: tableY2,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Row 3 - Practical
        const prac_standardText = practical_data.standard;
        const prac_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(prac_standardText, 12);
        firstPage.drawText(prac_standardText, {
          x: col1Center - (prac_standardWidth / 2),
          y: tableY3,
          size: 12,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (practical_data.percentage && !isNaN(practical_data.percentage)) {
          const prac_achievedText = `${practical_data.percentage}%`;
          const prac_achievedWidth = timesRomanFont.widthOfTextAtSize(prac_achievedText, 12);
          firstPage.drawText(prac_achievedText, {
            x: col2Center - (prac_achievedWidth / 2),
            y: tableY3,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (practical_data.passing_criteria && !isNaN(practical_data.passing_criteria)) {
          const prac_criteriaText = `${practical_data.passing_criteria}%`;
          const prac_criteriaWidth = timesRomanFont.widthOfTextAtSize(prac_criteriaText, 12);
          firstPage.drawText(prac_criteriaText, {
            x: col3Center - (prac_criteriaWidth / 2),
            y: tableY3,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
      } 
      /* COMMENTED OUT - 2-row table 
      else {
        // 2-row table (General + Specific only)
        const tableY1 = height * 0.38 + 25; // First row (General)
        const tableY2 = height * 0.38 + 10; // Second row (Specific)
        
        // Row 1 - General
        const gen_standardText = general_data.standard;
        const gen_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(gen_standardText, 12);
        firstPage.drawText(gen_standardText, {
          x: col1Center - (gen_standardWidth / 2),
          y: tableY1,
          size: 12,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (general_data.percentage && !isNaN(general_data.percentage)) {
          const gen_achievedText = `${general_data.percentage}%`;
          const gen_achievedWidth = timesRomanFont.widthOfTextAtSize(gen_achievedText, 12);
          firstPage.drawText(gen_achievedText, {
            x: col2Center - (gen_achievedWidth / 2),
            y: tableY1,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (general_data.passing_criteria && !isNaN(general_data.passing_criteria)) {
          const gen_criteriaText = `${general_data.passing_criteria}%`;
          const gen_criteriaWidth = timesRomanFont.widthOfTextAtSize(gen_criteriaText, 12);
          firstPage.drawText(gen_criteriaText, {
            x: col3Center - (gen_criteriaWidth / 2),
            y: tableY1,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Row 2 - Specific
        const spec_standardText = specific_data.standard;
        const spec_standardWidth = timesRomanBoldItalic.widthOfTextAtSize(spec_standardText, 12);
        firstPage.drawText(spec_standardText, {
          x: col1Center - (spec_standardWidth / 2),
          y: tableY2,
          size: 12,
          font: timesRomanBoldItalic,
          color: rgb(0, 0, 0)
        });
        
        if (specific_data.percentage && !isNaN(specific_data.percentage)) {
          const spec_achievedText = `${specific_data.percentage}%`;
          const spec_achievedWidth = timesRomanFont.widthOfTextAtSize(spec_achievedText, 12);
          firstPage.drawText(spec_achievedText, {
            x: col2Center - (spec_achievedWidth / 2),
            y: tableY2,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
        
        if (specific_data.passing_criteria && !isNaN(specific_data.passing_criteria)) {
          const spec_criteriaText = `${specific_data.passing_criteria}%`;
          const spec_criteriaWidth = timesRomanFont.widthOfTextAtSize(spec_criteriaText, 12);
          firstPage.drawText(spec_criteriaText, {
            x: col3Center - (spec_criteriaWidth / 2),
            y: tableY2,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          });
        }
      }
      */
    } else {
      // Single row table (existing logic) - keep at original position
      const tableY = height * 0.38 + 57;
      const col1Center = 173;
      const col2Center = 412;
      const col3Center = 650;
      
      const standardText = standard;
      const standardWidth = timesRomanBoldItalic.widthOfTextAtSize(standardText, 9);
      firstPage.drawText(standardText, {
        x: col1Center - (standardWidth / 2),
        y: tableY,
        size: 12,
        font: timesRomanBoldItalic,
        color: rgb(0, 0, 0)
      });
      
      if (percentage && !isNaN(percentage)) {
        const achievedText = `${percentage}%`;
        const achievedWidth = timesRomanFont.widthOfTextAtSize(achievedText, 9);
        firstPage.drawText(achievedText, {
          x: col2Center - (achievedWidth / 2),
          y: tableY,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        });
      }
      
      if (passing_criteria && !isNaN(passing_criteria)) {
        const criteriaText = `${passing_criteria}%`;
        const criteriaWidth = timesRomanFont.widthOfTextAtSize(criteriaText, 9);
        firstPage.drawText(criteriaText, {
          x: col3Center - (criteriaWidth / 2),
          y: tableY,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        });
      }
    }
    
    // For PT/MPT/UT/VT templates, add date of certification and validity
    if (templateType === 'PT' || templateType === 'MT' || templateType === 'UT') {
      // Certificate number
      firstPage.drawText(certificateNumber, {
        x: 189,
        y: 66,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
      
      // Date of Certification or Re-Certification (below table, left side)
      const certDateLabel = certification_type === 'Recertification' ? 'Date of Re-Certification' : 'Date of Certification';
      const dateOfCertText = `${certDateLabel}: ${formattedDate}`;
      firstPage.drawText(dateOfCertText, {
        x: 54,
        y: 190,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
      
      // Validity (below table, right side)
      const validityText = `Validity: ${validityDate}`;
      const validityWidth = timesRomanFont.widthOfTextAtSize(validityText, 15);
      firstPage.drawText(validityText, {
        x: width - validityWidth - 44,
        y: 190,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
      
      // Examiner DATE (bottom right corner)
      firstPage.drawText(formattedDate, {
        x: 671,
        y: 66,
        size: 13,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
    } else {
      // Standard templates (existing logic)
      const certNumSize = 13;
      firstPage.drawText(certificateNumber, {
        x: 188,
        y: 129,
        size: certNumSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
      
      const dateSize = 13;
      firstPage.drawText(formattedDate, {
        x: 667,
        y: 129,
        size: dateSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      });
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
      path: outputPath
    };
    
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw error;
  }
}

module.exports = { generateCertificate };
