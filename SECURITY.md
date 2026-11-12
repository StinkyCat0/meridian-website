# Security

Report vulnerabilities privately to the maintainer instead of opening a public issue. Include the
affected endpoint, a minimal reproduction, and the impact. Do not include live credentials.

## Practices in this repository

- Secrets live only in `.env` on the host. The repository contains placeholders in `.env.example`.
- The API validates `JWT_SECRET` at startup; production refuses short or example secrets.
- Passwords are bcrypt hashes and are never selected unless the login path explicitly asks.
- Public registration cannot set a role. Admin checks read the database record.
- Auth, password reset, and contact endpoints are rate limited; failed logins lock the account.
- Chat uploads are limited to images and PDFs under 10 MB.
- CORS allows configured origins only.
- The CRM bridge requires a shared secret or a signed, short-lived JWT. The website token cannot
  grant CRM roles.

## If a secret is exposed

Rotate it first, then remove it from history. Deleting a commit is not sufficient. Rotate
`JWT_SECRET` invalidates all website sessions; rotate `CRM_INTAKE_SECRET` and `WEBSITE_JWT_SECRET`
in both repositories together.
