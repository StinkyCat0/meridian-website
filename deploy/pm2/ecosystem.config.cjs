// deploy/pm2/ecosystem.config.cjs
//
// PM2 process definition for the Meridian API. Start it with:
//
//   pm2 start deploy/pm2/ecosystem.config.cjs --env production
//   pm2 save
//
// Paths are configurable so the file works outside this host:
//   API_APP_DIR  repository API directory (default /home/ssourin/meridian-project/apps/api)
//   LOG_DIR      PM2 log directory        (default $API_APP_DIR/logs)
//
// Secrets (MONGO_URI, JWT_SECRET, EMAIL_*, CRM_*) stay in apps/api/.env and
// are intentionally NOT defined here. Values set below take precedence over
// .env because dotenv does not overwrite existing environment variables.

const fs = require('fs');
const path = require('path');

const APP_DIR = process.env.API_APP_DIR || '/home/ssourin/meridian-project/apps/api';
const LOG_DIR = process.env.LOG_DIR || path.join(APP_DIR, 'logs');

// PM2 writes log files but does not create their parent directory.
fs.mkdirSync(LOG_DIR, { recursive: true });

module.exports = {
  apps: [
    {
      name: 'meridian-backend',
      cwd: APP_DIR,
      script: 'server.js',

      // Single fork process: the API keeps in-memory rate-limit state and one
      // Socket.IO server per database, so do not scale instances here.
      exec_mode: 'fork',
      instances: 1,

      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '512M',

      // server.js closes HTTP and Mongo on SIGTERM/SIGINT.
      kill_timeout: 5000,
      listen_timeout: 10000,
      // The app never calls process.send('ready'); enabling wait_ready would
      // make PM2 report a timeout on every start. Keep it false until the
      // server emits a readiness message.
      wait_ready: false,

      out_file: path.join(LOG_DIR, 'meridian-backend.out.log'),
      error_file: path.join(LOG_DIR, 'meridian-backend.err.log'),
      merge_logs: true,
      time: true,

      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '2000',
      },

      env_production: {
        NODE_ENV: 'production',
        // Loopback only: nginx on the same host is the sole public entrypoint.
        HOST: '127.0.0.1',
        PORT: '2000',
        // nginx is exactly one trusted reverse proxy; without this Express
        // sees the proxy socket address and every client shares a rate-limit
        // bucket.
        TRUST_PROXY: '1',
      },
    },
  ],
};
