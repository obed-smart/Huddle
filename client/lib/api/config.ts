/**
 * Where the Huddle backend lives. Set NEXT_PUBLIC_API_URL to its origin
 * (e.g. https://api.huddle.app). Left empty, requests are same-origin — which
 * is the simplest setup for the httpOnly session cookie to just work.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const authPaths = {
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  logout: "/api/v1/auth/logout",
  google: "/api/v1/auth/google",
  refresh: "/api/v1/auth/refresh",
} as const;

/** Full-page navigation target for Google sign-in (OAuth can't go through fetch). */
export function googleLoginUrl() {
  return `${API_BASE}${authPaths.google}`;
}
