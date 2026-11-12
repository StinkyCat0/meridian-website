# Contributing

This is a proprietary repository. Contributions are accepted by maintainer approval only.

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev
```

Node.js 22+ and MongoDB. Never commit `.env` files or real credentials.

## Branch and PR flow

1. Branch from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, or `chore/<topic>`.
2. Keep commits focused; imperative subject, body explains the why.
3. Open a pull request against `main`. Describe the user-visible change and exact verification.
4. One reviewer for code changes; docs-only changes may merge after CI.
5. Squash merge. Do not force-push shared branches.

## Required checks

- `npm run verify` runs all three checks below in order.
- `npm run lint` for the web app.
- `npm test` for the API. Tests use `TEST_MONGO_URI` (or the local
  `meridian_website_test` database) and refuse to drop any database whose name does not end in
  `_test`.
- `npm run build` for the web app.
- CodeQL runs on pull requests and `main`.
- No new dependency without the reason in the PR description.

## Review standard

Every PR is reviewed against [docs/REVIEW.md](docs/REVIEW.md). Findings are filed as GitHub issues
with a severity label; blocking findings must be fixed before merge.

## Code standards

- Web network access goes through `apps/web/src/lib/api.js`; do not hardcode hosts or ports in a
  page component.
- API routes validate input, return a JSON `message` on failure, and never leak stack traces or
  secrets in production.
- Mongo queries are scoped by the authenticated user or an explicit admin check.
- New fields on `User` are additive; the schema is shared with existing production data.
- Tests assert observable behavior (status, body, persisted row), not implementation text.
- Remove dead routes, debug overlays, and stray scripts rather than leaving them behind.
