/**
 * Where the client finds the backend.
 *
 * `API_BASE` is empty, which means "same origin": the browser calls `/api/v1`
 * on our own host and the Next server forwards it to the backend (the route
 * handler at `app/api/v1/[...path]`, or the next.config rewrite). The session
 * cookie stays first party, so there is no CORS to arrange. The test UI uses
 * `API_BASE = ""` for the same reason; there, Express serves the page, so same
 * origin already is the backend.
 *
 * `SOCKET_URL` is the one exception. A websocket cannot be forwarded cleanly
 * through Next (its handshake path and upgrade do not survive the rewrite), so
 * the socket connects straight to the backend. Set `NEXT_PUBLIC_SOCKET_URL` to
 * the backend origin, for example `http://localhost:5000`. The backend's
 * Socket.IO CORS must then allow this origin with credentials, so the handshake
 * carries the session cookie. Left empty, the socket falls back to same origin.
 */
export const API_BASE = "";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/+$/, "") ?? "";

/** Backend routes, grouped by area. Everything is under `/api/v1`. */
export const paths = {
  // auth
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  logout: "/api/v1/auth/logout",
  google: "/api/v1/auth/google",
  refresh: "/api/v1/auth/refresh",
  verifyEmail: "/api/v1/auth/verify-email",
  resendVerification: "/api/v1/auth/resend-verification",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
  // user
  me: "/api/v1/user/me",
  userSearch: "/api/v1/user/search",
  // conversations
  conversations: "/api/v1/conversation",
} as const;

/** The code the login route returns when the password is right but the email
    is not verified yet, so the UI can offer to resend the verification mail. */
export const EMAIL_UNVERIFIED_CODE = "EMAIL_UNVERIFIED_CODE";
