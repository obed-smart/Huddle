import { request, ApiError } from "./http";
import { paths } from "./config";
import type { AuthUser } from "./types";

export type RegisterInput = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
};

/** Sign in. The cookie is the session; the returned user is for display. */
export function login(identifier: string, password: string) {
  return request<AuthUser>(paths.login, {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export function register(input: RegisterInput) {
  return request<AuthUser>(paths.register, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** The server expires the cookie — this must be a real request, not a reset. */
export function logout() {
  return request<null>(paths.logout, { method: "POST" });
}

export function fetchMe() {
  return request<AuthUser>(paths.me);
}

export function verifyEmail(token: string) {
  return request(paths.verifyEmail, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return request(paths.resendVerification, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Email a 6-digit reset code. */
export function forgotPassword(email: string) {
  return request(paths.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Reset the password with the email, the 6-digit code, and the new password. */
export function resetPassword(input: {
  email: string;
  otp: string;
  password: string;
  passwordCompare: string;
}) {
  return request(paths.resetPassword, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export { ApiError };
