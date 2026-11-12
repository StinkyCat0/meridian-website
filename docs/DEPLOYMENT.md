# Deployment

## Processes

| Process | Command                         | Port | Notes                          |
| ------- | ------------------------------- | ---- | ------------------------------ |
| Web     | static files from `apps/web/dist` | 80/443 | nginx or any static host      |
| API     | `node apps/api/server.js`       | 2000 | Keep one instance per database |

MongoDB must be reachable from the API. In production use a dedicated database user with read/write
access to the `meridian` database only, and a TLS connection string.

## Build and publish

```bash
npm ci
npm run build
WEB_ROOT=/usr/share/nginx/meridianstudios.org npm run deploy
```

`scripts/deploy.sh` builds the SPA, replaces the nginx root atomically enough for a static site,
and restarts the `meridian-api` PM2 process. Override `WEB_ROOT` and `PM2_NAME` for other hosts.

## nginx

The SPA and the API share an origin. Proxy the API, websocket, and upload paths; serve everything
else from the build.

```nginx
server {
  listen 443 ssl http2;
  server_name meridianstudios.org www.meridianstudios.org;

  root /usr/share/nginx/meridianstudios.org;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:2000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:2000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:2000;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Environment

Copy `apps/api/.env.example` to `apps/api/.env` on the host and fill real values. Required:

- `MONGO_URI`
- `JWT_SECRET` (48+ random characters; the server refuses weak values outside development)
- `FRONTEND_URL` (exact public origin, comma-separated if there are several)
- `EMAIL_*` when outbound mail is enabled

Optional: the CRM bridge variables in [INTEGRATION.md](INTEGRATION.md).

`apps/web/.env` is only needed for a separate API origin or a CRM link. The built SPA otherwise uses
relative URLs.

## Rollback

Static rollback is restoring the previous `apps/web/dist` contents. API rollback is checking out the
previous release and restarting PM2. Database migrations are additive; do not roll back a schema by
dropping collections. Keep a MongoDB backup before deploying a release that changes indexes.
