const puppeteer = require('puppeteer');

exports.generate = async ({
  studentName, courseName, issuedDate,
  certificateNumber, verificationCode,
  attendancePercent, averageScore, template
}) => {
  const design = template.design || {};

  const backgroundColor = design.backgroundColor || '#FAFAF7';
  const accentColor = design.accentColor || '#2563EB';
  const textColor = design.textColor || '#1B3A5C';

  let fontFamily = 'Georgia, serif';
  if (design.fontStyle === 'sans') fontFamily = 'Arial, sans-serif';
  if (design.fontStyle === 'elegant') fontFamily = 'Palatino, Georgia, serif';

  const logoUrl = design.logoUrl;
  const borderStyle = design.borderStyle || 'double';

  const signatoryName = design.signatoryName || 'Course Instructor';
  const signatoryTitle = design.signatoryTitle || 'Lead Instructor';
  const instituteName = design.instituteName || 'Educational Institute';

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

  let htmlString = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Certificate</title>
        <style>
          body { margin: 0; padding: 0; width: 1122px; height: 794px; background-color: ${backgroundColor}; color: ${textColor}; font-family: ${fontFamily}; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding: 40px; }
          .cert-container { width: 100%; height: 100%; ${borderCSS} box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 40px; background-color: #ffffff; box-shadow: inset 0 0 40px rgba(0,0,0,0.05); }
          .logo { max-height: 80px; margin-bottom: 20px; }
          h1 { font-size: 46px; font-weight: bold; text-transform: uppercase; letter-spacing: 4px; margin: 0 0 10px 0; color: ${textColor}; text-align: center; }
          .decorative-line { width: 120px; height: 4px; background-color: ${accentColor}; margin: 10px 0 30px 0; }
          .subtitle { font-size: 20px; font-style: italic; margin-bottom: 20px; color: #666; }
          .student-name { font-size: 48px; font-weight: bold; color: ${accentColor}; margin-bottom: 20px; text-align: center; font-family: 'Times New Roman', serif; border-bottom: 2px solid #ccc; padding-bottom: 5px; width: 70%; }
          .course-name { font-size: 28px; font-weight: bold; margin: 20px 0; text-align: center; }
          .stats { font-size: 16px; color: #555; margin-bottom: 30px; }
          .issued-date { font-size: 18px; margin-bottom: 40px; }
          .signatures { display: flex; justify-content: space-between; width: 80%; margin-top: auto; margin-bottom: 40px; }
          .signature-block { text-align: center; width: 250px; }
          .signature-line { border-top: 1px solid ${textColor}; margin-bottom: 8px; padding-top: 8px; }
          .signatory-name { font-size: 18px; font-weight: bold; }
          .signatory-title { font-size: 14px; color: #666; }
          .footer { position: absolute; bottom: 20px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #888; font-family: sans-serif; }
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
          <div class="stats">Attendance: ${attendancePercent}% &nbsp; | &nbsp; Overall Score: ${averageScore}%</div>
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
            <div>Verify: /verify/${verificationCode}</div>
          </div>
        </div>
      </body>
      </html>
    `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlString, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('screen');

  const pdfBuffer = await page.pdf({
    width: '1122px',
    height: '794px',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  await browser.close();

  // Upload to Cloudinary
  const cloudinary = require('cloudinary').v2;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'certificates',
        resource_type: 'auto', // Auto-detect PDF as image/document resource type
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          fileUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );
    uploadStream.end(pdfBuffer);
  });
};
