# Meridian Website

[![CI](https://github.com/StinkyCat0/meridian-website/actions/workflows/ci.yml/badge.svg)](https://github.com/StinkyCat0/meridian-website/actions/workflows/ci.yml)
[![CodeQL](https://github.com/StinkyCat0/meridian-website/actions/workflows/codeql.yml/badge.svg)](https://github.com/StinkyCat0/meridian-website/actions/workflows/codeql.yml)
[![PR review](https://github.com/StinkyCat0/meridian-website/actions/workflows/pr-review.yml/badge.svg)](https://github.com/StinkyCat0/meridian-website/actions/workflows/pr-review.yml)

The public Meridian Studios site and the customer-facing API behind it. The marketing site, demo
sites, account login, password reset, contact form, and support chat live here. Staff operations
live in [`meridiancrm`](https://github.com/StinkyCat0/meridiancrm); the two repositories talk over a
small, documented HTTP contract instead of sharing a database or source tree.

| Package    | Purpose                                                                |
| ---------- | ---------------------------------------------------------------------- |
| `apps/web` | React 18 + Vite + Tailwind single-page site.                           |
| `apps/api` | Express 5 + MongoDB API: auth, email verification, contact, live chat. |
| `docs`     | Architecture, integration contract, deployment, and review standards.  |

## Quickstart

Requirements: Node.js 22+ and MongoDB running locally.

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# edit apps/api/.env: set MONGO_URI and a 32+ character JWT_SECRET
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:2000/api
- Health: http://localhost:2000/api/health
- Tests: `npm test` (uses `TEST_MONGO_URI`, defaults to a disposable local database)

Vite proxies `/api`, `/socket.io`, and `/uploads` to the API in development. Production serves the
built SPA from nginx and proxies the same paths to the API, so the browser uses same-origin URLs and
no CORS or API host needs to be configured.

## The login boundary

The MongoDB `User` schema in `apps/api/models/User.js` remains the identity record for public and
customer accounts. It is the schema that already exists in production; this repository preserves its
fields and adds only the methods the routes need.

The CRM keeps its own workspace members and roles in its own database. Integration is opt-in:

- **Website leads:** the API can forward contact submissions to the CRM lead pipeline with a shared
  server-to-server secret (`CRM_INTAKE_URL`, `CRM_INTAKE_SECRET`).
- **Staff SSO:** a verified website user explicitly granted `access.canAccessCrm` receives a JWT
  that the CRM can exchange for a CRM session (`WEBSITE_JWT_SECRET`). CRM roles are always read from
  the CRM database; the website token never grants a role.

Neither bridge is required to run the site. See [docs/INTEGRATION.md](docs/INTEGRATION.md).

## Website login

`/login` remains the Meridian website identity form: it posts to `POST /api/auth/login`, so MongoDB
users, bcrypt hashes, JWT expiry, lockouts, and verification work exactly as before. The UI now
matches the CRM sign-in surface. After a successful sign-in, a verified account with
`access.canAccessCrm` is redirected through the one-time CRM handoff; customers continue to
`/dashboard`.

For local development, `npm run seed:demo -w @meridian/website-api` creates
`demo@meridian.studio` / `Meridian2026!` (admin, CRM access) and `member@meridian.studio` /
`Meridian2026!` (staff, CRM access). Set `VITE_DEV_LOGIN_EMAIL` and `VITE_DEV_LOGIN_PASSWORD` in
`apps/web/.env.local` to render the development-only **Use dev account** button.

## CRM Studio service API

The CRM's Studio admin surfaces call this API server-to-server under `/api/studio/*` with an
`x-meridian-studio-token` header. Set `STUDIO_API_TOKEN` (32+ characters) and `CRM_URL` in
`apps/api/.env`; the routes answer `503` until the token is configured, and the one-time login
handoff is `POST /api/auth/crm-handoff`. Public demo visit counters live at `/api/demos`.

For local demo data (users, rooms, messages, inquiries, and visit counts):

```bash
npm run seed:demo
```

The seed is idempotent and refuses `NODE_ENV=production` or a non-local MongoDB unless
`SEED_DEMO_ALLOW_REMOTE=1`.

## Commands

| Command             | Use                                              |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | API and Vite in watch mode.                      |
| `npm run build`     | Production web build in `apps/web/dist`.         |
| `npm start`         | Start the API from `apps/api`.                   |
| `npm test`          | API tests against a disposable MongoDB database. |
| `npm run seed:demo` | Local-only idempotent demo data for Studio.      |
| `npm run lint`      | ESLint over the web app.                         |
| `npm run verify`    | Lint, API tests, and the web build in one gate.  |
| `npm run deploy`    | Build, publish to nginx, restart the API.        |

## Safety

- Never commit `.env` files. `.gitignore` excludes them; `.env.example` holds placeholders only.
- Passwords are bcrypt hashes; tokens are scoped, expiring JWTs; auth and contact endpoints are
  rate limited. Report vulnerabilities per [SECURITY.md](SECURITY.md).
- The web build is static. The API is the only process that reads MongoDB or sends email.

## License

Proprietary. See [LICENSE](LICENSE).
