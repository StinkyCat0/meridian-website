# Website ↔ CRM integration

Both projects stay deployable on their own. Integration is two optional, independently enabled
HTTP contracts. Nothing is shared on disk, and neither service opens the other's database.

## 1. Contact intake (website → CRM)

The website API stores every inquiry in MongoDB first. When `CRM_INTAKE_URL` and
`CRM_INTAKE_SECRET` are set, it then posts the inquiry to the CRM lead pipeline. Email delivery is
independent of this call.

```http
POST <CRM_INTAKE_URL>
Content-Type: application/json
X-Meridian-Intake-Secret: <CRM_INTAKE_SECRET>

{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "subject": "New storefront",
  "message": "We need a rebuild before spring.",
  "source": "website-contact"
}
```

The CRM endpoint creates or reuses a contact by email, opens a deal in the default pipeline's first
stage, and logs the inquiry as an inbound email communication. It responds `201 { "id": "<deal>" }`.
The website parses that body and stores the deal id as `crmDealId` on the inquiry; a malformed or
empty response leaves it null.
Rejected secrets return `401`; an unconfigured or unknown workspace returns `503`. The call has a
short timeout and is best-effort: the website never fails a user submission because the CRM is down.

Environment on the website:

| Variable            | Meaning                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `CRM_INTAKE_URL`    | Full URL, for example `https://crm.example.com/api/v1/public/intake` |
| `CRM_INTAKE_SECRET` | Shared secret; generate once and set the same value in the CRM       |
| `CRM_TIMEOUT_MS`    | Request timeout, default `5000`                                      |

## 2. Staff SSO (website login → CRM session)

The website already signs a JWT for its own sessions. The payload keeps `user.id` and `user.role`
and adds the claims needed for a deliberate handoff:

```json
{
  "user": {
    "id": "665f...",
    "role": "admin",
    "email": "ada@example.com",
    "name": "Ada Lovelace",
    "isVerified": true,
    "crmAccess": true
  },
  "iss": "meridian-website",
  "aud": "meridian-crm",
  "iat": 1760000000,
  "exp": 1760600000
}
```

`crmAccess` is derived from MongoDB `access.canAccessCrm`, which only an operator grants. The CRM
verifies the signature with `WEBSITE_JWT_SECRET` (the same value as the website `JWT_SECRET`), checks
the issuer, audience, expiry, `isVerified`, and `crmAccess`, then looks up a CRM user by the claimed
email. It issues a normal CRM session with the CRM role from `Membership`; the website token cannot
set a CRM role or workspace. Unknown emails and users without a membership are rejected.

```http
POST /api/v1/auth/website
Content-Type: application/json

{ "token": "<website JWT>" }
```

The response is the same shape as `POST /api/v1/auth/login`: `accessToken`, `expiresIn`, `user`,
`workspace`, and `role`, plus the rotating refresh cookie. The endpoint is rate limited and disabled
(503) unless `WEBSITE_JWT_SECRET` is configured.

## Enabling the bridges

Website `apps/api/.env`:

```dotenv
JWT_SECRET=<48+ random characters>
CRM_INTAKE_URL=https://crm.example.com/api/v1/public/intake
CRM_INTAKE_SECRET=<random characters>
# Studio service API + one-time handoff.
CRM_URL=https://crm.example.com
STUDIO_API_TOKEN=<openssl rand -base64 48 — 32+ characters>
```

CRM `apps/api/.env`:

```dotenv
WEBSITE_INTAKE_SECRET=<same value as CRM_INTAKE_SECRET>
WEBSITE_INTAKE_WORKSPACE_SLUG=meridian-studio
WEBSITE_JWT_SECRET=<same value as the website JWT_SECRET>
CORS_ORIGINS=https://meridianstudios.org,https://www.meridianstudios.org
# Studio BFF + one-time handoff.
WEBSITE_STUDIO_URL=https://meridianstudios.org
WEBSITE_STUDIO_TOKEN=<same value as the website STUDIO_API_TOKEN>
WEBSITE_PUBLIC_URL=https://meridianstudios.org
```

Each bridge is off when its secrets are absent. Enabling one does not enable the others.

## 3. Studio service API (CRM → website)

The CRM Studio BFF calls the website server-to-server. Every route under `/api/studio` requires
`x-meridian-studio-token: <STUDIO_API_TOKEN>` and is limited to 120 requests/minute. The token is
compared as a fixed-length SHA-256 digest in constant time; the API returns `503` while
`STUDIO_API_TOKEN` is empty or shorter than 32 characters and `401` for a missing/wrong token.
Secrets are never logged or returned. The full shape table lives in the CRM repository's
`docs/STUDIO_INTEGRATION.md`.

Endpoints: `GET /overview`, `GET|PATCH /accounts`, `GET|PATCH /inquiries`, `GET|POST /chat/rooms`,
`PATCH|DELETE /chat/rooms/:id`, `GET|POST /chat/rooms/:id/messages`, `GET /billing`, `GET /demos`,
`GET /settings`, and `POST /sso/inspect|/sso/consume`. Account responses omit passwords,
verification/reset tokens, lockout fields, and `stripeCustomerId`. Deactivating the last active
admin returns `409`. Chat message authors are resolved from `authorEmail`; the CRM never supplies a
display name or role.

### One-time login handoff

`POST /api/auth/crm-handoff` (website bearer token, verified + `access.canAccessCrm`, 10 per 15
minutes) stores a SHA-256 hash of a 32-byte random code with a 60-second TTL and returns only
`{ "url": "<CRM_URL>/login/website?code=..." }`. The CRM previews via `/api/studio/sso/inspect`
(does not consume) and confirms via `/api/studio/sso/consume`, which atomically marks `usedAt`.
Expired, replayed, unverified, or revoked accounts are rejected. Without `CRM_URL` the endpoint
returns `503` and the website shows its normal CRM link.

## 4. Demo visit counters (public)

`GET /api/demos` and `POST /api/demos/:key/visit` (60/minute per IP) persist per-demo visit totals in
MongoDB for keys `dental`, `luxesm`, `bakery`, and `corrowear`. The Studio reads the same counters
through `/api/studio/demos`. The local-only demo seed (`npm run seed:demo` in `apps/api`) is
idempotent and refuses `NODE_ENV=production` or a non-local `MONGO_URI` unless
`SEED_DEMO_ALLOW_REMOTE=1`.

## What is intentionally not shared

- Chat rooms and messages stay a website support surface. The Studio may moderate rooms and post
  as an existing website user through `/api/studio/chat/*`, but the CRM never stores its own copy of
  the chat model; CRM communications remain against CRM customers and jobs.
- The website's Mongo `User` is the public identity record. The CRM keeps staff users and
  workspace memberships. SSO maps one to the other; it never copies password hashes.
- Billing and subscription fields exist on the Mongo user for future work. No payment processor is
  wired in either repository.
