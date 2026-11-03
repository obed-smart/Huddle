import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a fresh nonce. Scripts run only from
 * our own origin and the one inline bootstrap Next tags with this nonce;
 * `strict-dynamic` lets that bootstrap load the rest, and there is no
 * `unsafe-inline` for scripts, so an injected `<script>` cannot execute.
 *
 * Style elements are nonce-gated too. Two exceptions, both without
 * `unsafe-inline`:
 *  - Inline style *attributes* (which Framer Motion and React `style={{}}` set
 *    on every animated node) have no nonce path in CSP, so
 *    `style-src-attr 'unsafe-inline'` is the narrowest allowance that keeps the
 *    motion UI working; it governs attributes only and lets no script run.
 *  - Sonner injects its toast stylesheet as an un-nonced <style> at runtime, in
 *    two steps (empty, then filled), so its two static shapes are allowed by
 *    exact hash. These are pinned to sonner 2.0.8; a version bump changes the
 *    CSS and must refresh SONNER_STYLE_HASH (a toast smoke test catches it).
 */
const EMPTY_STYLE_HASH = "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='";
const SONNER_STYLE_HASH = "'sha256-StEaX+se6YS7pqjzrzMIA0KaX9zF/8zAhvQXZAe5epY='";

function buildCsp(nonce: string, host: string | null): string {
  const wsEnv = process.env.BACKEND_WS_ORIGIN?.trim();
  const wsSelf = host ? `ws://${host} wss://${host}` : "";
  const connect = ["'self'", wsSelf, wsEnv].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' ${EMPTY_STYLE_HASH} ${SONNER_STYLE_HASH}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    `connect-src ${connect}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = buildCsp(nonce, request.headers.get("host"));

  // Next reads the nonce from the CSP on the *request* headers and stamps it
  // onto its own inline tags, so the nonce must travel inbound as well as out.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Every page, but not the proxied API, the socket, or static assets.
    {
      source:
        "/((?!api/v1|socket.io|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
