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

/* Called when the session is truly gone (a 401 a refresh couldn't fix). The
   session store registers a handler that signs out and returns to /login. */
let onSessionExpired: () => void = () => {};
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

/* A 401 from these means what it says — don't try to refresh them. */
const NO_REFRESH = new Set<string>([paths.login, paths.logout, paths.refresh]);

/* One refresh at a time: five parallel 401s trigger a single refresh. */
let refreshInFlight: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(API_BASE + paths.refresh, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  code?: string;
  error?: unknown;
};

/** Request the backend with the session cookie, unwrapping its {data} envelope. */
export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }

  if (res.status === 401 && !NO_REFRESH.has(path)) {
    if (!retried && (await refreshSession())) return request<T>(path, options, true);
    onSessionExpired();
  }

  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || body.success === false) {
    throw new ApiError(describeFailure(body, res.status), res.status, body.code ?? null);
  }
  return (body.data ?? (body as unknown)) as T;
}

function describeFailure(body: Envelope<unknown>, status: number): string {
  const candidates = [body?.message, body?.error];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  if (status >= 500) return `The server errored (${status}). Try again shortly.`;
  return `Request failed (${status}).`;
}
