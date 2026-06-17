const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email via Nodemailer + Gmail SMTP.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `UOP LMS <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent sequentially messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
