# Review standard

Reviews are evidence-based: file and line, observed behavior, and a concrete failure scenario.
Findings are filed as GitHub issues with a severity label. Blocking findings are fixed before merge.

## Blocking

- **Secrets**: `.env` or real credentials committed; tokens or passwords logged; a secret echoed in
  an error response.
- **Auth**: a route reads a role from the request body; a token grants more than the database user
  holds; a refresh or reset token is reusable; a login path skips the rate limit.
- **Data**: a chat or message read/write is not scoped to the authenticated user; the contact form
  loses an inquiry when email or the CRM is unavailable.
- **Injection**: request data reaches an HTML email without escaping, a filesystem path, or a shell.
- **Broken behavior**: an endpoint's response no longer matches what the web client consumes.
- **Integration**: a CRM call sends the wrong secret, trusts a website role, or has no timeout.

## Should fix

- Missing empty, loading, or error state in a touched screen.
- Hardcoded hostnames, ports, or `https://meridianstudios.org` in a component.
- Debug overlays, `console.log` on a hot path, commented-out blocks, or unused files.
- Uploads without a size or type limit; unbounded list queries.
- Tests that assert implementation text instead of behavior.
- Dead code and unused exports.

## Out of scope

Payment processing, a second chat product inside the CRM, native mobile builds, and email inbox
synchronization. Do not add a half-built version of a deferred feature.
