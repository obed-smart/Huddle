import { API_BASE, authPaths } from "./config";

/** An error carrying the backend's HTTP status and optional machine code. */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
};

export type RegisterInput = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
};

/** POST JSON to the backend with the session cookie, unwrapping its envelope. */
async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      payload?.message || payload?.error || "Something went wrong. Try again.";
    throw new ApiError(message, res.status, payload?.code);
  }
  return (payload?.data ?? payload) as T;
}

export function login(identifier: string, password: string) {
  return post<AuthUser>(authPaths.login, { identifier, password });
}

export function register(input: RegisterInput) {
  return post<AuthUser>(authPaths.register, input);
}
