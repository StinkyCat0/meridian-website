// apps/api/routes/contact.js - Public contact form: persist first, notify best-effort.
const express = require('express');
const Message = require('../models/Message');
const emailService = require('../utils/emailService');
const { forwardContactToCrm } = require('../utils/crmIntake');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_MESSAGE = "Message received. We'll get back to you soon.";

const contactLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });

router.post('/', contactLimiter, async (req, res) => {
  const body = req.body || {};
  const { website } = body;

  // Honeypot: real users never fill this field. Accept silently so bots do not
  // learn that they were detected.
  if (typeof website === 'string' && website.trim().length > 0) {
    return res.status(201).json({ message: SUCCESS_MESSAGE, id: null });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 1 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 1 and 100 characters' });
  }
  if (email.length < 1 || email.length > 200 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required' });
  }
  if (subject.length > 200) {
    return res.status(400).json({ message: 'Subject cannot exceed 200 characters' });
  }
  if (message.length < 1 || message.length > 5000) {
    return res
      .status(400)
      .json({ message: 'Message must be between 1 and 5000 characters' });
  }

  let stored;
  try {
    stored = await Message.create({ name, email, message });
  } catch (error) {
    console.error('Failed to store contact message:', error.message);
    return res.status(500).json({ message: 'Failed to save your message' });
  }

  // Neither notification path is allowed to change the successful response.
  const results = await Promise.allSettled([
    Promise.resolve().then(() =>
      emailService.sendContact({ name, email, subject, message }),
    ),
    Promise.resolve().then(() =>
      forwardContactToCrm({
        name,
        email,
        subject,
        message,
        source: 'website-contact',
      }),
    ),
  ]);

  const [emailResult, crmResult] = results;
  if (emailResult.status === 'rejected') {
    console.error('Contact email delivery failed:', emailResult.reason?.message);
  }
  if (crmResult.status === 'rejected') {
    console.error('CRM contact intake failed:', crmResult.reason?.message);
  }

  res.status(201).json({ message: SUCCESS_MESSAGE, id: stored._id });
});

module.exports = router;
