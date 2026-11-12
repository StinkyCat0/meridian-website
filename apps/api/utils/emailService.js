// backend/utils/emailService.js - Configurable outbound email service
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    const provider = (process.env.EMAIL_PROVIDER || 'zoho').toLowerCase();
    
    // Zoho Mail configuration (default)
    if (provider === 'zoho') {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.zoho.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE !== 'false',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
        tls: { rejectUnauthorized: false },
      });
    } 
    // Gmail fallback (if you switch providers later)
    else if (provider === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
    }
    // Add more providers as needed (SendGrid, Resend, etc.)
    
    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service connection failed:', error.message);
      } else {
        console.log(`✅ Email service ready: ${provider}`);
      }
    });
  }

  async send({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: { 
          name: process.env.EMAIL_FROM_NAME || 'Meridian Studios', 
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER 
        },
        to,
        subject,
        html,
        text,
      });
      if (process.env.DEBUG === 'true') {
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      }
      return info;
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      throw new Error('Failed to send email');
    }
  }

  async sendVerification(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    
    await this.send({
      to: user.email,
      subject: '🔐 Verify Your Meridian Studios Account',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to Meridian Studios!</h2>
          <p>Hi ${user.name},</p>
          <p>Click below to verify your email and activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Verify Email</a>
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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    
    await this.send({
      to: user.email,
      subject: '🔐 Meridian Studios — Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>Click below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset Password</a>
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
}

// Singleton instance
module.exports = new EmailService();
