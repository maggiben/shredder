const ACCESS_TOKEN_KEY = "shredder_access_token";
const USER_EMAIL_KEY = "shredder_user_email";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Backwards-compatible aliases used by existing dashboard components.
export function getStoredToken(): string | null {
  return getAccessToken();
}

export function setStoredToken(token: string): void {
  setAccessToken(token);
}

export function clearSession(): void {
  clearAccessToken();
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(USER_EMAIL_KEY);
}

export function getStoredUserEmail(): string | null {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(USER_EMAIL_KEY);
}

export function setStoredUserEmail(email: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(USER_EMAIL_KEY, email);
}

