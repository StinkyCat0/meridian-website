// apps/api/utils/emailService.js - Lazy, optional outbound email.
const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeText(value) {
  return String(value ?? '');
}

function debugLog(message) {
  if (process.env.DEBUG === 'true') {
    console.log(`✉️ ${message}`);
  }
}

class EmailService {
  constructor() {
    // Transport is created lazily on the first send so importing this module
    // (or booting the API) never opens a connection or verifies credentials.
    this.transporter = null;
  }

  isConfigured() {
    if (process.env.EMAIL_ENABLED !== 'true') return false;
    return Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    if (!this.isConfigured()) {
      debugLog('Email disabled or missing credentials; skipping outbound mail.');
      return null;
    }

    const provider = (process.env.EMAIL_PROVIDER || 'zoho').toLowerCase();

    if (provider === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.zoho.com',
        port: Number.parseInt(process.env.EMAIL_PORT, 10) || 465,
        secure: process.env.EMAIL_SECURE !== 'false',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
        tls: { rejectUnauthorized: false },
      });
    }

    return this.transporter;
  }

  from() {
    return {
      name: process.env.EMAIL_FROM_NAME || 'Meridian Studios',
      address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    };
  }

  async send({ to, subject, html, text }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      debugLog(`Skipped "${subject}" to ${to}: email is not configured.`);
      return null;
    }

    try {
      const info = await transporter.sendMail({
        from: this.from(),
        to,
        subject,
        html,
        text,
      });
      debugLog(`Sent "${subject}" to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`✉️ Email send failed: ${error.message}`);
      throw new Error('Failed to send email');
    }
  }

  async sendVerification(user, token) {
    const verifyUrl = `${(process.env.FRONTEND_URL || '').replace(/\/+$/, '')}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
    const name = escapeHtml(user.name);
    const safeUrl = escapeHtml(verifyUrl);

    return this.send({
      to: user.email,
      subject: 'Verify your Meridian Studios account',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to Meridian Studios!</h2>
          <p>Hi ${name},</p>
          <p>Click below to verify your email and activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Link expires in 1 hour. If you didn't create this account, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">© Meridian Studios • San Marcos, TX</p>
        </body>
        </html>
      `,
      text: `Welcome to Meridian Studios!\n\nClick to verify your email: ${verifyUrl}\n\nLink expires in 1 hour.`,
    });
  }

  async sendPasswordReset(user, token) {
    const resetUrl = `${(process.env.FRONTEND_URL || '').replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
    const name = escapeHtml(user.name);
    const safeUrl = escapeHtml(resetUrl);

    return this.send({
      to: user.email,
      subject: 'Meridian Studios — Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>Click below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">© Meridian Studios • San Marcos, TX</p>
        </body>
        </html>
      `,
      text: `Password Reset Request\n\nClick to reset your password: ${resetUrl}\n\nLink expires in 1 hour.`,
    });
  }

  async sendContact({ name, email, subject, message }) {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || 'New Message');
    const safeMessage = escapeHtml(message);
    const safeSubjectText = escapeText(subject || 'New Message');

    return this.send({
      to: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'antonio@meridianstudios.org',
      subject: `Contact Form: ${safeSubjectText}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${safeMessage}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Sent via Meridian Studios Contact Form</p>
        </body>
        </html>
      `,
      text: `New Contact Form Submission\n\nFrom: ${escapeText(name)} <${escapeText(email)}>\nSubject: ${safeSubjectText}\n\n${escapeText(message)}`,
    });
  }
}

module.exports = new EmailService();
