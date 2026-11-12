// backend/routes/contact.js - Updated to use emailService
const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService'); // ✅ Updated import

// POST /api/contact - Send contact form email
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }
    
    // Send email via configurable service (Zoho/Gmail/etc.)
    await emailService.send({
      to: process.env.EMAIL_FROM || 'antonio@meridianstudios.org',
      subject: `📬 Contact Form: ${subject || 'New Message'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Subject:</strong> ${subject || '(no subject)'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Sent via Meridian Studios Contact Form</p>
        </body>
        </html>
      `,
      text: `New Contact Form Submission\n\nFrom: ${name} <${email}>\nSubject: ${subject || '(no subject)'}\n\n${message}`,
    });
    
    res.status(200).json({ message: 'Message sent successfully. We\'ll get back to you soon!' });
    
  } catch (error) {
    console.error('❌ Contact form error:', error.message);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
