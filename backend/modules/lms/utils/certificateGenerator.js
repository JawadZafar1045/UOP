'use strict';

const PDFDocument = require('pdfkit');
const streamifier = require('streamifier');
const cloudinary  = require('../../../config/cloudinary');

/**
 * Generate a PDF certificate and upload it to Cloudinary.
 *
 * @param {object} params
 * @param {string} params.studentName
 * @param {string} params.courseName
 * @param {string} params.teacherName
 * @param {string} params.issuedDate          - Pre-formatted date string e.g. "04 May 2026"
 * @param {string} params.certificateNumber   - e.g. "UOP-2026-00001"
 * @param {string} params.verificationCode    - UUID v4
 * @param {number} params.attendancePercent
 * @param {number} params.averageScore        - Combined performance score
 * @returns {Promise<{ fileUrl: string, publicId: string }>}
 */
const generate = ({
  studentName,
  courseName,
  teacherName,
  issuedDate,
  certificateNumber,
  verificationCode,
  attendancePercent,
  averageScore,
}) => {
  return new Promise((resolve, reject) => {
    try {
      // ── 1. Create PDF document ───────────────────────────────────────────────
      const doc = new PDFDocument({
        size:   'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const W = doc.page.width;   // ~841
      const H = doc.page.height;  // ~595

      // ── 2. Collect chunks into buffer ────────────────────────────────────────
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        // ── 4. Upload to Cloudinary ──────────────────────────────────────────
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder:        'certificates',
            public_id:     `cert_${certificateNumber}`,
            format:        'pdf',
          },
          (error, result) => {
            if (error) {
              console.error('[CertificateGenerator] Cloudinary upload error:', error);
              return reject(error);
            }
            resolve({ fileUrl: result.secure_url, publicId: result.public_id });
          }
        );
        streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
      });
      doc.on('error', reject);

      // ── 3. Draw the certificate ──────────────────────────────────────────────

      // Background
      doc.rect(0, 0, W, H).fill('#FAFAF7');

      // Outer border
      doc.rect(20, 20, W - 40, H - 40)
        .lineWidth(3)
        .strokeColor('#1B3A5C')
        .stroke();

      // Inner border
      doc.rect(26, 26, W - 52, H - 52)
        .lineWidth(1)
        .strokeColor('#2563EB')
        .stroke();

      // ── Header ───────────────────────────────────────────────────────────────
      const topY = 60;
      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#6B7280')
        .text('CERTIFICATE OF COMPLETION', 0, topY, { align: 'center', width: W });

      // Horizontal rule
      const ruleY = topY + 22;
      doc.moveTo(60, ruleY).lineTo(W - 60, ruleY)
        .lineWidth(0.8)
        .strokeColor('#D1D5DB')
        .stroke();

      // ── Body ──────────────────────────────────────────────────────────────────
      let y = ruleY + 22;

      doc.font('Helvetica')
        .fontSize(14)
        .fillColor('#374151')
        .text('This is to certify that', 0, y, { align: 'center', width: W });

      y += 34;

      // Student name — hero element
      doc.font('Helvetica-Bold')
        .fontSize(36)
        .fillColor('#1B3A5C')
        .text(studentName, 0, y, { align: 'center', width: W });

      y += 52;

      doc.font('Helvetica')
        .fontSize(14)
        .fillColor('#374151')
        .text('has successfully completed the course', 0, y, { align: 'center', width: W });

      y += 30;

      // Course name
      doc.font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#2563EB')
        .text(courseName, 0, y, { align: 'center', width: W });

      y += 46;

      // Stats line
      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#6B7280')
        .text(
          `Attendance: ${attendancePercent}%   |   Performance Score: ${averageScore}%`,
          0, y,
          { align: 'center', width: W }
        );

      y += 24;

      // Issue date
      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#374151')
        .text(`Issued on: ${issuedDate}`, 0, y, { align: 'center', width: W });

      // ── Signature lines ───────────────────────────────────────────────────────
      const sigY       = H - 110;
      const lineLen    = 160;
      const leftSigX   = 100;
      const rightSigX  = W - 100 - lineLen;

      // Left signature line
      doc.moveTo(leftSigX, sigY).lineTo(leftSigX + lineLen, sigY)
        .lineWidth(1)
        .strokeColor('#374151')
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#1B3A5C')
        .text(teacherName, leftSigX, sigY + 6, { width: lineLen, align: 'center' });

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Course Instructor', leftSigX, sigY + 20, { width: lineLen, align: 'center' });

      // Right signature line
      doc.moveTo(rightSigX, sigY).lineTo(rightSigX + lineLen, sigY)
        .lineWidth(1)
        .strokeColor('#374151')
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#1B3A5C')
        .text('Unified Operations Platform', rightSigX, sigY + 6, { width: lineLen, align: 'center' });

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Issuing Authority', rightSigX, sigY + 20, { width: lineLen, align: 'center' });

      // ── Footer ────────────────────────────────────────────────────────────────
      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#9CA3AF')
        .text(
          `Certificate No: ${certificateNumber}   |   Verify at: yourdomain.com/verify/${verificationCode}`,
          0, H - 52,
          { align: 'center', width: W }
        );

      // Finalize the PDF (triggers 'end' event)
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generate };
