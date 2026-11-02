/**
 * Where the Huddle backend lives. Empty = same-origin (simplest for the
 * httpOnly session cookie). Set NEXT_PUBLIC_API_URL to the backend origin
 * when the client is served separately (then the backend must send
 * SameSite=None; Secure and allow this origin with credentials).
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/+$/,
  "",
);

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
