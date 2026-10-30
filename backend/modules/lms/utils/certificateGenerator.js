const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const cloudinary = require('../../../config/cloudinary');

/**
 * Fallback generator using PDFKit in case Puppeteer fails in the host environment.
 */
const generateWithPdfKit = async ({
  studentName, courseName, issuedDate,
  certificateNumber, verificationCode,
  signatoryName, instituteName
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40,
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(4)
        .strokeColor('#0E8696')
        .stroke();

      doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52)
        .lineWidth(1)
        .strokeColor('#021F37')
        .stroke();

      // Header
      doc.moveDown(2);
      doc.font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#021F37')
        .text('CERTIFICATE OF COMPLETION', { align: 'center', characterSpacing: 2 });

      doc.moveDown(0.5);
      doc.font('Helvetica')
        .fontSize(14)
        .fillColor('#64748b')
        .text('THIS IS PROUDLY PRESENTED TO', { align: 'center' });

      // Student Name
      doc.moveDown(1);
      doc.font('Helvetica-Bold')
        .fontSize(32)
        .fillColor('#0E8696')
        .text(studentName, { align: 'center' });

      // Description
      doc.moveDown(0.8);
      doc.font('Helvetica')
        .fontSize(14)
        .fillColor('#475569')
        .text('for successfully completing all curriculum requirements for the course', { align: 'center' });

      // Course Name
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#021F37')
        .text(courseName, { align: 'center' });

      doc.moveDown(1.5);
      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#64748b')
        .text(`Issued on: ${issuedDate}`, { align: 'center' });

      // Signatures
      const bottomY = doc.page.height - 120;
      doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#021F37')
        .text(signatoryName || 'Lead Instructor', 80, bottomY, { width: 220, align: 'center' });
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#64748b')
        .text('Course Instructor', 80, bottomY + 16, { width: 220, align: 'center' });

      doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#021F37')
        .text(instituteName || 'School of Information Security', doc.page.width - 300, bottomY, { width: 220, align: 'center' });
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#64748b')
        .text('Issuing Authority', doc.page.width - 300, bottomY + 16, { width: 220, align: 'center' });

      // Footer
      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#94a3b8')
        .text(`Certificate ID: ${certificateNumber}  |  Verification Code: ${verificationCode}`, 40, doc.page.height - 45, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

exports.generate = async ({
  studentName, courseName, issuedDate,
  certificateNumber, verificationCode,
  attendancePercent = 100, averageScore = 100, template
}) => {
  const design = (template && template.design) || {};

  const backgroundColor = design.backgroundColor || '#FAFAF7';
  const accentColor = design.accentColor || '#0E8696';
  const textColor = design.textColor || '#021F37';

  let fontFamily = 'Georgia, serif';
  if (design.fontStyle === 'sans') fontFamily = 'Arial, sans-serif';
  if (design.fontStyle === 'elegant') fontFamily = 'Palatino, Georgia, serif';

  const logoUrl = design.logoUrl;
  const borderStyle = design.borderStyle || 'double';

  const signatoryName = design.signatoryName || 'Course Instructor';
  const signatoryTitle = design.signatoryTitle || 'Lead Instructor';
  const instituteName = design.instituteName || 'School of Information Security';

  let borderCSS = '';
  if (borderStyle === 'double') {
    borderCSS = `
      border: 12px solid ${accentColor};
      outline: 4px solid ${accentColor};
      outline-offset: -20px;
    `;
  } else if (borderStyle === 'single') {
    borderCSS = `border: 8px solid ${accentColor};`;
  }

  const htmlString = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Certificate</title>
        <style>
          body { margin: 0; padding: 0; width: 1122px; height: 794px; background-color: ${backgroundColor}; color: ${textColor}; font-family: ${fontFamily}; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding: 40px; }
          .cert-container { width: 100%; height: 100%; ${borderCSS} box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 40px; background-color: #ffffff; box-shadow: inset 0 0 40px rgba(0,0,0,0.05); }
          .logo { max-height: 80px; margin-bottom: 20px; }
          h1 { font-size: 44px; font-weight: bold; text-transform: uppercase; letter-spacing: 4px; margin: 0 0 10px 0; color: ${textColor}; text-align: center; }
          .decorative-line { width: 120px; height: 4px; background-color: ${accentColor}; margin: 10px 0 25px 0; }
          .subtitle { font-size: 18px; font-style: italic; margin-bottom: 16px; color: #64748b; }
          .student-name { font-size: 46px; font-weight: bold; color: ${accentColor}; margin-bottom: 16px; text-align: center; font-family: 'Times New Roman', serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; width: 70%; }
          .course-name { font-size: 26px; font-weight: bold; margin: 16px 0; text-align: center; color: ${textColor}; }
          .stats { font-size: 15px; color: #64748b; margin-bottom: 24px; }
          .issued-date { font-size: 16px; margin-bottom: 30px; color: #475569; }
          .signatures { display: flex; justify-content: space-between; width: 80%; margin-top: auto; margin-bottom: 30px; }
          .signature-block { text-align: center; width: 250px; }
          .signature-line { border-top: 1px solid ${textColor}; margin-bottom: 8px; padding-top: 8px; }
          .signatory-name { font-size: 16px; font-weight: bold; color: ${textColor}; }
          .signatory-title { font-size: 13px; color: #64748b; }
          .footer { position: absolute; bottom: 20px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; font-family: sans-serif; }
        </style>
      </head>
      <body>
        <div class="cert-container">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
          <h1>Certificate of Completion</h1>
          <div class="decorative-line"></div>
          <div class="subtitle">This is to certify that</div>
          <div class="student-name">${studentName}</div>
          <div class="subtitle">has successfully completed the course</div>
          <div class="course-name">${courseName}</div>
          <div class="stats">Curriculum Completion: 100% &nbsp; | &nbsp; Attendance: ${attendancePercent}%</div>
          <div class="issued-date">Issued on ${issuedDate}</div>
          <div class="signatures">
            <div class="signature-block">
              <div class="signature-line">
                <div class="signatory-name">${signatoryName}</div>
                <div class="signatory-title">${signatoryTitle}</div>
              </div>
            </div>
            <div class="signature-block">
              <div class="signature-line">
                <div class="signatory-name">${instituteName}</div>
                <div class="signatory-title">Issuing Authority</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <div>Certificate ID: ${certificateNumber}</div>
            <div>Verification: ${verificationCode}</div>
          </div>
        </div>
      </body>
      </html>
    `;

  let pdfBuffer;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    pdfBuffer = await page.pdf({
      width: '1122px',
      height: '794px',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    await browser.close();
  } catch (puppeteerErr) {
    console.warn('[CertificateGenerator] Puppeteer failed, using PDFKit fallback:', puppeteerErr.message);
    pdfBuffer = await generateWithPdfKit({
      studentName,
      courseName,
      issuedDate,
      certificateNumber,
      verificationCode,
      signatoryName,
      instituteName,
    });
  }

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'certificates',
        resource_type: 'auto',
        format: 'pdf',
      },
      (error, result) => {
        if (error) {
          console.error('[CertificateGenerator] Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            fileUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(pdfBuffer);
  });
};

