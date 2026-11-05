import { API_BASE, paths } from "./config";

/** A failed API call, carrying the backend's status and optional machine code. */
export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * The backend wraps every response as `{ success, data, message, code }`.
 * `request` returns the unwrapped `data`, or throws an `ApiError`.
 */
/** The backend sends `message` either as a plain string or, on an error, nested
    as `{ status, message }` (its error envelope wraps it). Both shapes here. */
type ServerMessage = string | { status?: string; message?: string };
type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: ServerMessage;
  code?: string;
  error?: unknown;
};

/* When the session is truly gone (a 401 that even a refresh cannot fix), the
   session store signs out and returns to /login. It registers that here. */
let onSessionExpired: () => void = () => {};
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

/* A 401 from the auth routes themselves means the credentials are wrong, not
   that the access token expired, so refreshing and retrying them is pointless. */
const SKIP_REFRESH_ON_401 = new Set<string>([paths.login, paths.logout, paths.refresh]);

/* The access token expired: mint a fresh one from the httpOnly refresh cookie.
   Kept to one in-flight call so a burst of parallel 401s triggers a single
   refresh, not one per request. Resolves true when the refresh succeeded. */
let refreshInFlight: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(API_BASE + paths.refresh, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Call the backend with the session cookie and unwrap its envelope.
 *
 * On a 401 it refreshes the token once and replays the request; if the refresh
 * also fails, the session is over and `onSessionExpired` runs. Any non-ok
 * response (or `success: false`) becomes an `ApiError` carrying a message safe
 * to show the user.
 */
export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_BASE + path, {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }

  if (response.status === 401 && !SKIP_REFRESH_ON_401.has(path)) {
    if (!isRetry && (await refreshSession())) return request<T>(path, options, true);
    onSessionExpired();
  }

  const body = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || body.success === false) {
    const raw = serverMessage(body);
    const code = body.code ?? (raw && isMachineCode(raw) ? raw : null);
    throw new ApiError(describeFailure(raw, response.status), response.status, code);
  }
  return (body.data ?? (body as unknown)) as T;
}

/** The backend's human string, out of whichever shape carried it: a plain
    `message`, the nested `{ status, message }` it wraps errors in, or `error`. */
function serverMessage(body: Envelope<unknown>): string | null {
  const m = body?.message;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (m && typeof m === "object" && typeof m.message === "string" && m.message.trim()) {
    return m.message.trim();
  }
  if (typeof body?.error === "string" && body.error.trim()) return body.error.trim();
  return null;
}

/** A SCREAMING_SNAKE token the backend uses as a machine signal (e.g.
    EMAIL_UNVERIFIED_CODE), not a sentence meant for a person to read. */
function isMachineCode(text: string): boolean {
  return /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(text);
}

/** One user-facing sentence, never a server internal or a raw machine code.
    A 5xx stays generic so nothing leaks; a 4xx shows the backend's own reason. */
function describeFailure(raw: string | null, status: number): string {
  if (status >= 500) return `The server errored (${status}). Try again shortly.`;
  if (raw && !isMachineCode(raw)) {
    const s = raw.charAt(0).toUpperCase() + raw.slice(1);
    return /[.!?]$/.test(s) ? s : `${s}.`;
  }
  return `Request failed (${status}).`;
}
