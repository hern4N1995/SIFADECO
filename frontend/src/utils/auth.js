export const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000;
export const LAST_ACTIVITY_KEY = 'lastActivityAt';

export function clearAuthStorage() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('csrfToken');
  localStorage.removeItem('csrfTokenExpiry');
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function isSessionExpired(lastActivityAt, now = Date.now()) {
  return now - lastActivityAt > INACTIVITY_LIMIT_MS;
}

export function getTimeUntilExpiry(lastActivityAt, now = Date.now()) {
  return Math.max(INACTIVITY_LIMIT_MS - (now - lastActivityAt), 0);
}
