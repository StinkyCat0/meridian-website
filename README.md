# Meridian Website

The public Meridian Studios site and the customer-facing API behind it. The marketing site, demo
sites, account login, password reset, contact form, and support chat live here. Staff operations
live in [`meridiancrm`](https://github.com/StinkyCat0/meridiancrm); the two repositories talk over a
small, documented HTTP contract instead of sharing a database or source tree.

| Package  | Purpose                                                                   |
| -------- | ------------------------------------------------------------------------- |
| `apps/web` | React 18 + Vite + Tailwind single-page site.                             |
| `apps/api` | Express 5 + MongoDB API: auth, email verification, contact, live chat.   |
| `docs`     | Architecture, integration contract, deployment, and review standards.    |

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

## Commands

| Command        | Use                                                |
| -------------- | -------------------------------------------------- |
| `npm run dev`  | API and Vite in watch mode.                        |
| `npm run build`| Production web build in `apps/web/dist`.           |
| `npm start`    | Start the API from `apps/api`.                     |
| `npm test`     | API tests against a disposable MongoDB database.   |
| `npm run lint` | ESLint over the web app.                           |
| `npm run deploy` | Build, publish to nginx, restart the API.       |

## Safety

- Never commit `.env` files. `.gitignore` excludes them; `.env.example` holds placeholders only.
- Passwords are bcrypt hashes; tokens are scoped, expiring JWTs; auth and contact endpoints are
  rate limited. Report vulnerabilities per [SECURITY.md](SECURITY.md).
- The web build is static. The API is the only process that reads MongoDB or sends email.

## License

Proprietary. See [LICENSE](LICENSE).
