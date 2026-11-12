// Best-effort bridge from the public website contact form into the CRM.
const DEFAULT_TIMEOUT_MS = 5000;

async function forwardContactToCrm({ name, email, subject, message, source } = {}) {
  const url = process.env.CRM_INTAKE_URL;
  const secret = process.env.CRM_INTAKE_SECRET;

  if (!url || !secret) return { skipped: true };

  const timeout = Number(process.env.CRM_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Meridian-Intake-Secret': secret,
    },
    body: JSON.stringify({ name, email, subject, message, source }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    const error = new Error(`CRM intake rejected the contact with status ${response.status}`);
    error.status = response.status;
    error.statusCode = response.status;
    throw error;
  }

  return { ok: true, status: response.status };
}

module.exports = { forwardContactToCrm };
