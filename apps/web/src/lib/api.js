export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const CRM_URL = (import.meta.env.VITE_CRM_URL || '').replace(/\/$/, '');
export const apiUrl = (path) => `${API_ORIGIN}/api${path.startsWith('/') ? path : `/${path}`}`;
export const assetUrl = (path) => !path ? '' : /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
export const socketOrigin = () => API_ORIGIN || window.location.origin;
export function getToken() { return localStorage.getItem('meridian_token'); }
export function clearSession() { localStorage.removeItem('meridian_token'); localStorage.removeItem('meridian_user'); }
