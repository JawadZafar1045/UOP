const nodemailer = require('nodemailer');

/**
 * Dynamically construct the Nodemailer transporter based on .env configuration.
 * Supports standard SMTP (port 587 / 465) or Gmail service.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Returns formatted sender address
 */
const getFromAddress = () => {
  const name = process.env.EMAIL_FROM_NAME || 'School of Information Security';
  const address =
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    process.env.RESEND_FROM_EMAIL ||
    'noreply@cszone.pk';
  return `"${name}" <${address}>`;
};

/**
 * Core sendEmail helper.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body fallback
 * @param {string} html - HTML rich body
 */
const sendEmail = async (to, subject, text, html) => {
  if (!to) {
    console.warn('[EmailService] No recipient email specified.');
    return null;
  }

  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Dispatches a security notification email when a user logs in.
 * Non-blocking: will not interrupt the login flow if SMTP fails.
 */
const sendLoginNotificationEmail = async (user, meta = {}) => {
  if (!user || !user.email) return;

  const loginTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Karachi',
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const ip = meta.ip || 'Unknown IP';
  const device = meta.userAgent || 'Web Browser';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = `Security Alert: Successful Login to CSZone Academy`;
  const text = `Hello ${user.name || 'User'},\n\nA successful login to your CSZone Academy account was detected.\n\nTime: ${loginTime} (PKT)\nIP Address: ${ip}\nDevice: ${device}\n\nIf this was you, no action is required.\nIf you did not initiate this login, please reset your password immediately.\n\nBest regards,\nCSZone Academy Security Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d5e0e8; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #021F37 0%, #0E8696 100%); padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CS ZONE ACADEMY</h1>
        <p style="color: #9fd4db; margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">Account Security Notification</p>
      </div>

      <div style="padding: 28px 24px; color: #021F37;">
        <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${user.name || 'Student'}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4d6477;">
          We detected a successful sign-in to your CSZone Academy account.
        </p>

        <div style="background: #f4f8fb; border: 1px solid #d5e0e8; border-radius: 12px; padding: 18px; margin: 22px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #5f7587; font-weight: 600; width: 35%;">Date & Time:</td>
              <td style="padding: 6px 0; color: #021F37; font-weight: 700;">${loginTime} PKT</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #5f7587; font-weight: 600;">IP Address:</td>
              <td style="padding: 6px 0; color: #021F37; font-family: monospace; font-weight: 700;">${ip}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #5f7587; font-weight: 600;">Client / Device:</td>
              <td style="padding: 6px 0; color: #021F37; font-size: 12px;">${device}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #5f7587; font-weight: 600;">Account:</td>
              <td style="padding: 6px 0; color: #0E8696; font-weight: 700;">${user.email}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
            <strong>Security Tip:</strong> If this was you, you can safely disregard this email. If you did not log in, please secure your account immediately by changing your password.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0 12px 0;">
          <a href="${frontendUrl}/dashboard" style="display: inline-block; background: #0E8696; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 6px rgba(14,134,150,0.3);">
            Go to Your Dashboard →
          </a>
        </div>
      </div>

      <div style="background: #f4f8fb; border-top: 1px solid #d5e0e8; padding: 16px 24px; text-align: center; font-size: 11px; color: #5f7587;">
        <p style="margin: 0;">© ${new Date().getFullYear()} CSZone Academy. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">School of Information Security & Cyber Defense</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(user.email, subject, text, html);
  } catch (err) {
    console.warn('[EmailService] Login notification email failed (non-fatal):', err.message);
  }
};

/**
 * Dispatches an email notification when an administrator approves a user's account.
 */
const sendUserApprovalEmail = async (user) => {
  if (!user || !user.email) return;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const subject = `🎉 Congratulations! Your CSZone Academy Account Is Approved`;

  const text = `Hello ${user.name || 'Student'},\n\nGreat news! Your account on CSZone Academy has been approved by the administrator.\n\nYou can now log in, explore our cybersecurity and AI security catalog, and start learning.\n\nLogin here: ${frontendUrl}/login\n\nBest regards,\nCSZone Academy Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d5e0e8; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0b6f7c 0%, #0E8696 100%); padding: 32px 24px; text-align: center;">
        <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 12px; margin-bottom: 12px;">
          <span style="font-size: 32px;">🎓</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Account Approved!</h1>
        <p style="color: #eaf3f7; margin: 6px 0 0 0; font-size: 13px;">Welcome to CSZone Academy</p>
      </div>

      <div style="padding: 30px 24px; color: #021F37;">
        <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${user.name || 'Learner'}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4d6477;">
          Your registration has been reviewed and <strong style="color: #10B981;">approved</strong> by our administrative team. Your account is now fully active.
        </p>

        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
          <h4 style="margin: 0 0 8px 0; color: #065F46; font-size: 14px; font-weight: 700;">What You Can Do Now:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 13px; line-height: 1.8;">
            <li>Browse and enroll in high-impact certification bootcamps</li>
            <li>Access recorded sessions, lectures, and hands-on labs</li>
            <li>Track your progress, assignments, and certificates</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0 16px 0;">
          <a href="${frontendUrl}/login" style="display: inline-block; background: #021F37; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 10px rgba(2,31,55,0.25);">
            Log In to Your Account →
          </a>
        </div>
      </div>

      <div style="background: #f4f8fb; border-top: 1px solid #d5e0e8; padding: 16px 24px; text-align: center; font-size: 11px; color: #5f7587;">
        <p style="margin: 0;">© ${new Date().getFullYear()} CSZone Academy. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">Need help? Reply directly to this email or reach out to support.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(user.email, subject, text, html);
  } catch (err) {
    console.warn('[EmailService] User approval email delivery failed (non-fatal):', err.message);
  }
};

/**
 * Send an official Certificate of Completion email to a student.
 */
const sendCertificateEmail = async ({
  to,
  studentName,
  courseTitle,
  certificateNumber,
  verificationCode,
  downloadUrl,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const myCertificatesUrl = `${portalUrl}/lms/certificates`;
  const verifyUrl = `${portalUrl}/verify/${verificationCode}`;
  const directDownload = downloadUrl || myCertificatesUrl;

  const subject = `🎓 Congratulations! Your Certificate for "${courseTitle}" is Ready`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate of Completion</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f8fb; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d5e0e8; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
        .header { background: linear-gradient(135deg, #021F37 0%, #0b4a66 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; font-size: 40px; margin-bottom: 8px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 8px 0 0; color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; }
        .content { padding: 32px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; color: #021F37; margin-bottom: 12px; }
        .message { font-size: 15px; color: #475569; margin-bottom: 24px; }
        .cert-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0E8696; border-radius: 10px; padding: 20px; margin-bottom: 28px; }
        .cert-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .cert-row:last-child { margin-bottom: 0; }
        .cert-label { color: #64748b; font-weight: 500; }
        .cert-value { color: #021F37; font-weight: 700; }
        .cta-box { text-align: center; margin: 32px 0 24px; }
        .btn-primary { display: inline-block; background-color: #0b6f7c; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px rgba(14, 134, 150, 0.25); }
        .btn-secondary { display: inline-block; margin-top: 12px; color: #0E8696; text-decoration: underline; font-size: 13px; font-weight: 600; }
        .notice-box { background: #eff6ff; border: 1px dashed #bfdbfe; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #1e40af; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">🎓</div>
          <h1>Certificate of Completion</h1>
          <p>Official Verification</p>
        </div>
        <div class="content">
          <div class="greeting">Congratulations, ${studentName || 'Student'}!</div>
          <p class="message">
            You have successfully completed all course modules and requirements for <strong>${courseTitle}</strong>. 
            Your official certificate has been issued and registered in the system.
          </p>

          <div class="cert-card">
            <div class="cert-row">
              <span class="cert-label">Course:</span>
              <span class="cert-value">${courseTitle}</span>
            </div>
            <div class="cert-row">
              <span class="cert-label">Certificate ID:</span>
              <span class="cert-value">${certificateNumber}</span>
            </div>
            <div class="cert-row">
              <span class="cert-label">Issue Date:</span>
              <span class="cert-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div class="cta-box">
            <a href="${directDownload}" class="btn-primary" target="_blank">Download Your Certificate (PDF)</a>
            <br>
            <a href="${verifyUrl}" class="btn-secondary" target="_blank">Verify Certificate Authenticity Online &rarr;</a>
          </div>

          <div class="notice-box">
            💾 <strong>Permanent LMS Backup:</strong> If you ever misplace this email, don't worry! You can always view and re-download your certificate anytime by logging in to the LMS portal under the <strong>My Certificates</strong> section.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} School of Information Security. All rights reserved.<br>
          This is an automated academic credential verification email.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Congratulations, ${studentName || 'Student'}!\n\nYou have completed the course: ${courseTitle}.\nCertificate ID: ${certificateNumber}\n\nYou can download and view your certificate anytime by logging into the LMS portal under 'My Certificates':\n${myCertificatesUrl}\n\nVerify certificate online: ${verifyUrl}\n`;

  return sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendLoginNotificationEmail,
  sendUserApprovalEmail,
  sendCertificateEmail,
};
