// apps/api/server.js - HTTP composition for the customer-facing API.
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const contactRoutes = require('./routes/contact');
const chatRoutes = require('./routes/chat');
const { errorHandler } = require('./middleware/errorMiddleware');
const registerSocketHandlers = require('./socket');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

function allowedOrigins() {
  const configured = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (configured.length > 0) return configured;
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

function buildApp() {
  const app = express();
  const origins = allowedOrigins();

  app.disable('x-powered-by');
  // One trusted reverse proxy is the normal deployment; do not trust a
  // client-supplied X-Forwarded-For unless the operator opts in.
  app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin requests and server-to-server calls have no Origin.
        if (!origin || origins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const database = mongoose.connection.readyState === 1 ? 'up' : 'down';
    res.status(database === 'up' ? 200 : 503).json({
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/chat', chatRoutes);
  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      index: false,
      dotfiles: 'deny',
      maxAge: '1y',
      immutable: true,
      setHeaders(res) {
        // Stored names are generated from an allow-listed MIME type; keep the
        // served type explicit and never let a browser guess.
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
      },
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  app.use(errorHandler);

  return app;
}

function createServer() {
  const app = buildApp();
  const server = http.createServer(app);
  const origins = allowedOrigins();
  const io = new Server(server, {
    cors: {
      origin: origins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.set('io', io);
  registerSocketHandlers(io);

  return { app, server, io };
}

async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return mongoose.connection;
}

async function start() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/meridian';
  await connectDatabase(uri);
  const { server } = createServer();
  const port = Number.parseInt(process.env.PORT || '2000', 10);

  server.listen(port, () => {
    console.log(`Meridian website API listening on port ${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      mongoose.disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start API:', error.message);
    process.exit(1);
  });
}

module.exports = { buildApp, createServer, connectDatabase, start, UPLOAD_DIR };
