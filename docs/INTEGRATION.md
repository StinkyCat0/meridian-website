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
Rejected secrets return `401`; an unconfigured or unknown workspace returns `503`. The call has a
short timeout and is best-effort: the website never fails a user submission because the CRM is down.

Environment on the website:

| Variable            | Meaning                                                        |
| ------------------- | -------------------------------------------------------------- |
| `CRM_INTAKE_URL`    | Full URL, for example `https://crm.example.com/api/v1/public/intake` |
| `CRM_INTAKE_SECRET` | Shared secret; generate once and set the same value in the CRM |
| `CRM_TIMEOUT_MS`    | Request timeout, default `5000`                                 |

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
```

CRM `apps/api/.env`:

```dotenv
WEBSITE_INTAKE_SECRET=<same value as CRM_INTAKE_SECRET>
WEBSITE_INTAKE_WORKSPACE_SLUG=meridian-studio
WEBSITE_JWT_SECRET=<same value as the website JWT_SECRET>
CORS_ORIGINS=https://meridianstudios.org,https://www.meridianstudios.org
```

Both features are off when their secrets are absent. Enabling one does not enable the other.

## What is intentionally not shared

- Chat rooms and messages are a website support surface, not CRM communications. The CRM models
  logged customer conversations against its own customers and jobs; importing chat would duplicate
  that model and break its tenancy boundary.
- The website's Mongo `User` is the public identity record. The CRM keeps staff users and
  workspace memberships. SSO maps one to the other; it never copies password hashes.
- Billing and subscription fields exist on the Mongo user for future work. No payment processor is
  wired in either repository.
