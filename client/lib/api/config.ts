/**
 * The client always talks to its own origin, never to the backend directly. The
 * Next server stands in front as the BFF: `/api/v1/*` is forwarded by the route
 * handler at `app/api/v1/[...path]/route.ts`, `/socket.io` is proxied by a
 * rewrite (a websocket cannot go through a route handler), and the first paint
 * reads happen in server components. So `API_BASE` is empty (same origin): the
 * backend URL never reaches the browser, and the httpOnly session cookie stays
 * first party, which means no CORS and no SameSite=None.
 */
export const API_BASE = "";

export const paths = {
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  logout: "/api/v1/auth/logout",
  google: "/api/v1/auth/google",
  refresh: "/api/v1/auth/refresh",
  verifyEmail: "/api/v1/auth/verify-email",
  resendVerification: "/api/v1/auth/resend-verification",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
  me: "/api/v1/user/me",
  userSearch: "/api/v1/user/search",
  conversations: "/api/v1/conversation",
} as const;

/** Marker the login route returns when the password is right but email is unverified. */
export const EMAIL_UNVERIFIED_CODE = "EMAIL_UNVERIFIED_CODE";

/** Full-page navigation target for Google sign-in (OAuth can't go through fetch). */
export function googleLoginUrl() {
  return `${API_BASE}${paths.google}`;
}
