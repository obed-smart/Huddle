/**
 * The backend base URL. The client talks to the backend directly (REST and the
 * socket connect straight to this origin), so it must be public. It is not a
 * secret: the only credential is the httpOnly session cookie, which no script
 * can read. The backend serves Express and Socket.IO on this one origin, and the
 * socket.io client appends its own `/socket.io` path there automatically.
 *
 * Set `NEXT_PUBLIC_API_URL` to that origin (for example http://localhost:5000).
 * Left empty, the app talks to its own origin, which only works behind a reverse
 * proxy that serves the API on the same host. The backend must allow this origin
 * with credentials (CORS) and set the session cookie SameSite=None;Secure so it
 * rides cross origin requests.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

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
