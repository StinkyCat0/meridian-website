# Deployment

This document covers the production host that runs Meridian Studios. The public entrypoint is
**Cloudflare Tunnel**; nginx runs on the host behind it, serves the built SPA from
`/usr/share/nginx/meridianstudios.org`, and proxies `/api/`, `/socket.io/` and `/uploads/` to a
loopback-only Node process managed by PM2. The repository ships the nginx and PM2 configuration as
reviewable files under `deploy/`; the host copies them into place by hand.

> **Nothing in CI or the deploy workflow installs nginx configuration.** `.github/workflows/ci.yml`
> runs lint, build, dependency audit and API tests; it does not deploy. The deployment workflow (when
> enabled) publishes the web build and restarts the API. Installing or reloading nginx remains a
> manual, reviewed host operation.

## Topology

| Component | Runs as | Address | Notes |
| --- | --- | --- | --- |
| Cloudflare edge | Cloudflare | public 443 | Terminates public TLS and forwards through the tunnel |
| `cloudflared` | system service on the host | outbound only | Forwards the public request to nginx as plain HTTP on loopback |
| nginx | system service | `127.0.0.1:80`, `[::1]:80` (tunnel) and `0.0.0.0:443`, `[::]:443` (direct fallback) | No HTTP-to-HTTPS redirect on the tunnel leg |
| API | PM2 app `meridian-backend` | `127.0.0.1:2000` | One fork process; never bound publicly |
| SPA | static files in `/usr/share/nginx/meridianstudios.org` | served by nginx | Built from `apps/web` |
| MongoDB | host or managed service | reachable from the API | Not proxied by nginx |

Public origins are `https://meridianstudios.org` and `https://www.meridianstudios.org`. Browser
traffic reaches Cloudflare, the tunnel forwards it to nginx on loopback, and nginx proxies the three
dynamic paths to `127.0.0.1:2000`.

The tunnel itself (credentials, ingress rules, DNS) is managed outside this repository. Do not commit
tunnel credentials or Cloudflare API tokens.

## Prerequisites

- Node.js 22 (`node -v` must report v22.x) and npm.
- nginx with the `http_ssl_module` and `http_v2_module` (`nginx -V` shows them).
- PM2 installed globally (`npm i -g pm2`).
- `cloudflared` installed and its tunnel configured to forward the public hostnames to
  `http://127.0.0.1:80` (or `http://[::1]:80`).
- MongoDB reachable from the host, with a dedicated database user and a TLS connection string in
  production.
- A TLS certificate/key for the direct 443 listener (see [TLS](#tls-certificate-and-renewal)).
- The repository checked out on the host, e.g. `/home/ssourin/meridian-project`.

## Host setup

### 1. Install dependencies and configure the API

```bash
cd /home/ssourin/meridian-project
npm ci
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env - MONGO_URI, JWT_SECRET, FRONTEND_URL, EMAIL_* as needed
```

Required `apps/api/.env` values:

- `MONGO_URI` - database connection string.
- `JWT_SECRET` - a long random value (48+ characters); generate with
  `openssl rand -base64 48`.
- `FRONTEND_URL` - the exact public origin(s), comma-separated, e.g.
  `https://meridianstudios.org,https://www.meridianstudios.org`.
- `EMAIL_*` - only when outbound mail is enabled.

`HOST=127.0.0.1`, `PORT=2000`, `NODE_ENV=production` and `TRUST_PROXY=1` are set by the PM2
ecosystem file, so they do not need to be duplicated in `.env`. Optional CRM bridge variables are
documented in [INTEGRATION.md](INTEGRATION.md).

Never commit `.env` or put secrets in the PM2 file.

### 2. Build the web app

```bash
npm run build          # writes apps/web/dist
```

### 3. Publish the web root

```bash
sudo install -d -o root -g root -m 0755 /usr/share/nginx/meridianstudios.org
sudo rsync -a --delete apps/web/dist/ /usr/share/nginx/meridianstudios.org/
```

nginx serves this directory read-only; it must not be writable by the Node process.

## nginx configuration

The repository ships three files. The two `00-*.conf` files are `http`-context snippets; the site
file is a `server` block that serves both the tunnel listener and the direct TLS listener.

| Repository file | Install to | Context |
| --- | --- | --- |
| `deploy/nginx/00-websocket-upgrade.conf` | `/etc/nginx/conf.d/00-websocket-upgrade.conf` | `http` (defines `$connection_upgrade`) |
| `deploy/nginx/00-rate-limits.conf` | `/etc/nginx/conf.d/00-rate-limits.conf` | `http` (client-IP maps + `limit_req_zone`s) |
| `deploy/nginx/meridianstudios.org.conf` | `/etc/nginx/conf.d/meridianstudios.org.conf` | `server` (same `http` include as the `00-*` files) |

All three files live in `/etc/nginx/conf.d/`; the `00-` prefixes make nginx parse them before the
site block. An existing live file at `/etc/nginx/conf.d/meridianstudios.org.conf` is what this
replaces.

```bash
sudo install -m 0644 deploy/nginx/00-websocket-upgrade.conf /etc/nginx/conf.d/00-websocket-upgrade.conf
sudo install -m 0644 deploy/nginx/00-rate-limits.conf       /etc/nginx/conf.d/00-rate-limits.conf
sudo install -m 0644 deploy/nginx/meridianstudios.org.conf  /etc/nginx/conf.d/meridianstudios.org.conf
```

On this Arch-style host `nginx.conf` includes the directory once, in the `http` context:

```nginx
include /etc/nginx/conf.d/*.conf;
```

nginx expands the glob in filename order, so `00-rate-limits.conf` and `00-websocket-upgrade.conf`
are parsed before `meridianstudios.org.conf`. Do not rename the site file with a `00-` prefix; the
maps and zones must be defined first. If the include line is absent, add it to the `http` block.

**Debian/Ubuntu alternative (not used on this host):** install the site block to
`/etc/nginx/sites-available/meridianstudios.org.conf`, symlink it into `sites-enabled`, and keep the
two `00-*.conf` files in `conf.d`. In that layout `nginx.conf` must include `conf.d/*.conf` before
`sites-enabled/*`.

### Validate and reload

Always validate before reloading. A failed test leaves the running configuration untouched.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

`reload` (not `restart`) keeps existing connections alive. Check `systemctl status nginx` and
`journalctl -u nginx -n 50` if the reload fails.

### Ingress and listener layout

The site file intentionally differs from a typical public web server:

- **Port 80 is loopback-only and does not redirect.** `listen 127.0.0.1:80; listen [::1]:80;` is
  how `cloudflared` reaches the origin, and the tunnel's origin leg is plain HTTP. Adding an
  HTTP-to-HTTPS redirect here would break the tunnel. Public clients never reach this listener
  directly.
- **Port 443 is the direct fallback.** `listen 443 ssl http2; listen [::]:443 ssl http2;` serves the
  same app over TLS. If direct access is not needed, remove those listens (or firewall 443) and rely
  solely on the tunnel.
- Both listeners share one `server` block so the routing rules exist once. `$server_port` selects
  the client-address behavior: on 80 the real client is Cloudflare's `CF-Connecting-IP`; on 443 it
  is the peer address, so a direct client cannot spoof the header.
- `server_name meridianstudios.org www.meridianstudios.org`; the tunnel preserves the public `Host`
  header.

If the host has IPv6 disabled, drop the `[::1]:80` and `[::]:443` listeners; `cloudflared` should
then target `127.0.0.1:80` explicitly.

### What the site config enforces

- **TLS.** TLS 1.2/1.3 only, ECDHE cipher suites, a shared 10 MB session cache, session tickets
  disabled. Certificate paths are the host's `/etc/nginx/ssl/meridianstudios.org.crt|key`; commented
  alternatives show the Let's Encrypt lineage layout without assuming it is used. OCSP stapling is
  present but commented until the chain and resolver are confirmed.
- **Headers.** `server_tokens off`, HSTS (`max-age=31536000; includeSubDomains`, deliberately **no**
  `preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and
  `Cross-Origin-Opener-Policy: same-origin`.
- **CSP is report-only.** `Content-Security-Policy-Report-Only` allows the real third parties:
  Stripe.js (script/frame/connect), Cloudflare Insights (script/connect), Google Fonts
  (style/font), Unsplash demo imagery (img), and same-origin demo video. `connect-src` also lists
  `wss://meridianstudios.org` and `wss://www.meridianstudios.org` explicitly because some browsers
  do not treat `'self'` as sufficient for WebSocket connections (Socket.IO uses WSS).
  `script-src` does **not** include `'unsafe-inline'` or `'unsafe-eval'`; `style-src` allows
  `'unsafe-inline'` because React and framer-motion emit style attributes. Before switching to an
  enforcing policy, reproduce the site's main flows (landing, auth, dashboard, checkout redirect,
  chat, all demo pages), collect violations from the browser console, fix the sources or the build
  output, and only then rename the header. Do not weaken `script-src`; if a build introduces an
  inline script, change the build.
- **Proxying.** `/api/`, `/socket.io/` and `/uploads/` go to `http://127.0.0.1:2000` with
  `proxy_http_version 1.1`, the correct `Host`, `X-Real-IP`, `X-Forwarded-For`,
  `X-Forwarded-Proto` and `X-Forwarded-Host`. `/socket.io/` sets the WebSocket upgrade headers from
  the shared map, disables proxy buffering, and allows long idle connections. `/uploads/` is
  proxy-only with no directory listing. The live host previously lacked the Socket.IO and uploads
  locations, which broke chat and attachments; both are required.
- **Client address.** nginx sends exactly one `X-Forwarded-For` value, normalized from
  `CF-Connecting-IP` on the tunnel listener or `$remote_addr` on 443. The API trusts exactly one
  proxy hop (`TRUST_PROXY=1`). Never expose the loopback listener to untrusted networks, or
  `CF-Connecting-IP` becomes spoofable and per-IP limits can be evaded.
- **Rate limits.** Edge zones in `00-rate-limits.conf`, keyed on the normalized client address: auth
  `10r/m` burst 5, contact `5r/m` burst 3, general API `120r/m` burst 60. Throttled requests return
  **429**. Static assets and uploads are not rate-limited. The API additionally enforces its own
  in-process limits, so a 429 can come from either layer.
- **Body size and uploads.** `client_max_body_size 12m` (the API caps attachments at 10 MiB plus
  multipart overhead).
- **Static caching.** Hashed files under `/assets/` are `immutable` for one year; HTML and other
  unhashed files get `Cache-Control: no-cache` via `expires -1`.
- **SPA fallback.** `try_files $uri $uri/ /index.html`. Dotfiles are denied except `/.well-known/`.
  `autoindex` is off.

The config deliberately avoids `if` inside `location` and keeps full header blocks in locations
that declare their own `add_header` (nginx does not merge `add_header` from parent scopes). Keep
those repeated sets in sync when editing.

> nginx 1.25.1+ deprecates `listen ... http2`. The file uses the widely accepted form; on a newer
> nginx, switch to `listen 443 ssl; ... http2 on;` to silence the warning. Either form passes
> `nginx -t`.

## API process (PM2)

The checked-in definition is `deploy/pm2/ecosystem.config.cjs`:

- name **`meridian-backend`** (the live process name, kept so the existing deployment can be
  migrated in place), `exec_mode: 'fork'`, `instances: 1`
- `script: server.js`, `cwd` = `API_APP_DIR` or `/home/ssourin/meridian-project/apps/api`
- `autorestart`, bounded restarts, `max_memory_restart: '512M'`, `kill_timeout: 5000`,
  `listen_timeout: 10000`
- `wait_ready: false` (the server does not emit a PM2 readiness message)
- logs at `$LOG_DIR/meridian-backend.{out,err}.log` (`LOG_DIR` defaults to `apps/api/logs` and is
  created on start)
- `env_production`: `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=2000`, `TRUST_PROXY=1`

`TRUST_PROXY=1` is required because nginx is exactly one trusted proxy; without it Express records
the nginx socket as the client and every visitor shares one rate-limit bucket.

The live process may still be running with the old `cwd` (`/home/ssourin/meridian-project/backend`).
Inspect it, then migrate once during a maintenance window:

```bash
pm2 describe meridian-backend     # note the old cwd/script

pm2 delete meridian-backend
pm2 start deploy/pm2/ecosystem.config.cjs --env production
pm2 save
pm2 describe meridian-backend     # expect cwd .../apps/api and script server.js
```

Persist across reboots (once):

```bash
pm2 save
pm2 startup            # run the printed command once, as root
```

Subsequent releases:

```bash
pm2 reload meridian-backend --update-env
```

In fork mode `reload` behaves like a graceful restart. A brief Socket.IO disconnect is expected;
clients reconnect automatically.

Useful checks:

```bash
pm2 status
pm2 logs meridian-backend --lines 100
pm2 describe meridian-backend
```

Overrides: `API_APP_DIR=/path/to/repo/apps/api LOG_DIR=/var/log/meridian pm2 start ...`.

## Loopback binding and firewall

The API must listen on loopback only. After the companion change, `server.js` honors `HOST`; PM2
sets `HOST=127.0.0.1`. Verify:

```bash
ss -ltnp | grep ':2000'
# expected: 127.0.0.1:2000 ... node
```

A `0.0.0.0:2000` or `*:2000` listener means the API is publicly reachable and must be fixed before
going live.

Public exposure expectations:

- **Port 80:** not public. nginx binds it to loopback and only `cloudflared` uses it; do not add a
  firewall allow rule for 80.
- **Port 443:** public only while the direct TLS listener exists. A tunnel-only deployment can close
  it; Cloudflare Tunnel uses outbound connections and needs no inbound ports.
- **Port 2000:** never public.
- **SSH:** keep your administration port restricted.

Example with ufw for a tunnel-only host (adjust SSH):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status verbose
```

If direct 443 is in use, add `sudo ufw allow 443/tcp`. Mirror the same rules in any cloud security
group. Do not open 80 or 2000.

## Health checks

The API exposes `GET /api/health`. It returns 200 with `{"status":"ok","database":"up",...}` when
Mongo is connected, and 503 when it is not.

```bash
# from the host, direct to the API
curl -fsS http://127.0.0.1:2000/api/health

# through nginx on the loopback tunnel listener
curl -fsS -H 'Host: meridianstudios.org' http://127.0.0.1/api/health

# through the public tunnel (proves Cloudflare + tunnel + nginx + API)
curl -fsS https://meridianstudios.org/api/health

curl -fsSI https://meridianstudios.org/ | grep -iE 'strict-transport|x-content-type|x-frame|referrer|permissions|content-security'

# websocket handshake should return HTTP 400/426 (not 502/504) without auth
curl -si -o /dev/null -w '%{http_code}\n' \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  'https://meridianstudios.org/socket.io/?EIO=4&transport=websocket'
```

`curl -f` treats 503 as failure, which is what a monitor should do. Point external monitoring at the
public `/api/health`.

## TLS certificate and renewal

Certificate issuance and rotation are managed outside this repository. The nginx config uses
`/etc/nginx/ssl/meridianstudios.org.crt` and `.key`; replace them with the host's real files and do
not assume a particular CA. With Cloudflare Tunnel as the only ingress, public clients see
Cloudflare's edge certificate and the origin certificate is only relevant to the direct 443
listener (the tunnel forwards plain HTTP to loopback).

To rotate the direct-listener certificate:

```bash
sudo install -o root -g root -m 0644 new-fullchain.crt /etc/nginx/ssl/meridianstudios.org.crt
sudo install -o root -g root -m 0600 new-privkey.key   /etc/nginx/ssl/meridianstudios.org.key
sudo nginx -t && sudo systemctl reload nginx
openssl s_client -connect 127.0.0.1:443 -servername meridianstudios.org </dev/null \
  | openssl x509 -noout -subject -dates
```

If the host later adopts certbot with Let's Encrypt, point `ssl_certificate`/`ssl_certificate_key`
at the lineage under `/etc/letsencrypt/live/` and reload. Because the public port 80 is not the
origin's, HTTP-01 validation cannot reach this nginx directly; use DNS-01 (e.g. the Cloudflare
plugin) or Cloudflare-managed/Origin certificates instead. A renewal must always be followed by
`nginx -t && systemctl reload nginx` (add a deploy hook if an ACME client manages it).

HSTS is set for one year with `includeSubDomains` and intentionally **without** `preload`.

## Deploying a release

Manual path (also what `scripts/deploy.sh` automates):

```bash
cd /home/ssourin/meridian-project
git fetch origin && git checkout <release-sha>
npm ci
npm run build
sudo rsync -a --delete apps/web/dist/ /usr/share/nginx/meridianstudios.org/
pm2 reload meridian-backend --update-env
curl -fsS https://meridianstudios.org/api/health
```

Or use the repository script. Note that its default PM2 name is `meridian-api`, so override it:

```bash
WEB_ROOT=/usr/share/nginx/meridianstudios.org PM2_NAME=meridian-backend npm run deploy
```

`scripts/deploy.sh` builds the SPA, replaces the web root (rsync, or a `cp -a` fallback), and
restarts the named PM2 process; if PM2 does not know that name it starts `apps/api/server.js` with
`--name <name> --cwd apps/api`. It does not touch nginx, does not run migrations, and does not read
`.env` for you.

The deployment workflow, when enabled, performs the build/publish/restart steps and starts the app
from this ecosystem file with `pm2 start deploy/pm2/ecosystem.config.cjs --only meridian-backend`, so
the app name in the file must stay `meridian-backend`. **The workflow never edits, installs, or
reloads nginx configuration.** nginx changes are always a separate reviewed host operation with
`nginx -t`.

## Rollback

Keep the previous release SHA and a copy of the current nginx config before changing either.

**Web/API code:**

```bash
cd /home/ssourin/meridian-project
git checkout <previous-sha>
npm ci
npm run build
sudo rsync -a --delete apps/web/dist/ /usr/share/nginx/meridianstudios.org/
pm2 reload meridian-backend --update-env
curl -fsS https://meridianstudios.org/api/health
```

If the previous release's web artifacts were archived, restore them to the web root instead of
rebuilding.

**nginx:** restore the backups, validate, reload:

```bash
sudo cp /etc/nginx/conf.d/meridianstudios.org.conf.bak \
  /etc/nginx/conf.d/meridianstudios.org.conf
sudo cp /etc/nginx/conf.d/00-rate-limits.conf.bak /etc/nginx/conf.d/00-rate-limits.conf
sudo nginx -t && sudo systemctl reload nginx
```

**PM2:** if a bad environment change caused the failure, revert `apps/api/.env` or the ecosystem
file, then `pm2 reload meridian-backend --update-env`. `pm2 delete meridian-backend` followed by a
fresh `pm2 start deploy/pm2/ecosystem.config.cjs --env production` is the last resort.

**Database:** migrations/index changes are additive. Do not drop collections to roll back. Take a
MongoDB backup before a release that changes indexes or data shape.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| 502/504 from nginx | `pm2 status`, `pm2 logs meridian-backend`, `ss -ltnp \| grep 2000`; confirm the API is on `127.0.0.1:2000` |
| Public site unreachable, origin fine | `systemctl status cloudflared`, `journalctl -u cloudflared`, tunnel ingress configuration |
| Chat or attachments 404 | `/socket.io/` and `/uploads/` locations present; `pm2 logs`; Socket.IO map installed in `conf.d` |
| 429 from the public site | Expected on abusive auth/contact/API traffic; inspect `meridianstudios.access.log`, the zones, and the API's own limits. If all clients appear as 127.0.0.1, the `CF-Connecting-IP` map or tunnel headers are wrong |
| 413 on upload | `client_max_body_size 12m` and the API's 10 MiB attachment cap |
| WebSocket fails behind the tunnel | Upgrade map installed in `conf.d`, `proxy_http_version 1.1`, `Connection $connection_upgrade`; Cloudflare proxies WebSockets by default |
| Health 503 | MongoDB unreachable from the API; `/api/health` reports `database: down` |
| SPA routes 404 | `try_files $uri $uri/ /index.html` and the `root` path |
| Config rejected | `sudo nginx -t` prints the file/line; the running config is unchanged until a successful reload |
| Port 80 conflict | Another service or an old default site is bound to 80; this config needs 80 on loopback only |
