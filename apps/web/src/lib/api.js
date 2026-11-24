export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const CRM_URL = (import.meta.env.VITE_CRM_URL || '').replace(/\/$/, '');
export const apiUrl = (path) => `${API_ORIGIN}/api${path.startsWith('/') ? path : `/${path}`}`;
export const assetUrl = (path) => !path ? '' : /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
export const socketOrigin = () => API_ORIGIN || window.location.origin;
export function getToken() { return localStorage.getItem('meridian_token'); }
export function clearSession() { localStorage.removeItem('meridian_token'); localStorage.removeItem('meridian_user'); }

// Exchange the signed-in website session for a one-time CRM login URL.
export async function requestCrmHandoff() {
  const token = getToken();
  const res = await fetch(apiUrl('/auth/crm-handoff'), {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: 'include'
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok || !data.url) {
    throw new Error(data.message || 'CRM handoff is unavailable.');
  }

  return { url: data.url };
}

// Public demo visit counts, stored server-side.
export async function fetchDemos() {
  const res = await fetch(apiUrl('/demos'), {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('Unable to load demo stats.');

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }

  return Array.isArray(data.items) ? data.items : [];
}

// Fire-and-forget visit ping for a demo environment.
export async function trackDemoVisit(key) {
  if (!key) return;
  await fetch(apiUrl(`/demos/${encodeURIComponent(key)}/visit`), {
    method: 'POST'
  });
}
