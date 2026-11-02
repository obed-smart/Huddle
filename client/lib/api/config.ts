/**
 * The API is same-origin: the deployment serves `/api/v1` and `/socket.io` from
 * the same host as the app — a reverse proxy, or the guarded rewrites in
 * next.config pointing at the server-only `BACKEND_ORIGIN`. No backend URL is
 * ever shipped to the browser (that keeps it out of the bundle and lets the
 * httpOnly session cookie ride along as a first-party cookie).
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
