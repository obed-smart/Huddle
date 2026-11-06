import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a fresh nonce.
 *
 * Production is strict: scripts run only from our origin and the inline
 * bootstrap Next tags with this nonce (`strict-dynamic` lets that bootstrap load
 * the rest), with no `unsafe-inline` and no `unsafe-eval`, so an injected script
 * cannot run. Styles are nonce gated too; inline style attributes (Framer Motion,
 * React `style={{}}`) go through `style-src-attr`, and sonner's runtime stylesheet
 * is allowed by exact hash (pinned to sonner 2.0.8; a version bump changes the CSS
 * and must refresh SONNER_STYLE_HASH).
 *
 * Development is relaxed, because `next dev` (React refresh, Turbopack, the error
 * overlay) needs `eval` and inline scripts and styles. We also drop
 * `upgrade-insecure-requests` in dev, since the dev server runs on plain http.
 */
const EMPTY_STYLE_HASH = "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='";
const SONNER_STYLE_HASH = "'sha256-StEaX+se6YS7pqjzrzMIA0KaX9zF/8zAhvQXZAe5epY='";

/** The socket connects straight to the backend over websocket, so connect-src
    must allow that origin's ws (and wss) form. */
function socketWs(): string[] {
  const raw = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const ws = url.protocol === "https:" ? "wss:" : "ws:";
    return [`${ws}//${url.host}`];
  } catch {
    return [];
  }
}

/** Object storage the browser talks to directly with a signed URL: it PUTs an
    upload and GETs media back. R2's S3 endpoint is
    <bucket>.<account>.r2.cloudflarestorage.com; a custom media domain (an R2
    public domain or your own) can be added with NEXT_PUBLIC_MEDIA_ORIGIN. These
    are fetch/XHR targets, so they must be in connect-src or the browser blocks
    the upload before it leaves the page. */
function mediaHosts(): string[] {
  const hosts = ["https://*.r2.cloudflarestorage.com"];
  const custom = process.env.NEXT_PUBLIC_MEDIA_ORIGIN?.trim();
  if (custom) hosts.push(custom);
  return hosts;
}

function buildCsp(nonce: string, host: string | null, dev: boolean): string {
  // Our own origin (REST and the SSR reads are same origin), our own ws, the
  // backend the socket connects straight to over websocket, and object storage
  // the browser uploads to and downloads media from directly.
  const wsSelf = host ? `ws://${host} wss://${host}` : "";
  const connect = [
    "'self'",
    wsSelf,
    ...socketWs(),
    ...mediaHosts(),
    process.env.BACKEND_WS_ORIGIN?.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  const scriptSrc = dev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const styleSrc = dev
    ? "style-src 'self' 'unsafe-inline'"
    : `style-src 'self' 'nonce-${nonce}' ${EMPTY_STYLE_HASH} ${SONNER_STYLE_HASH}`;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    scriptSrc,
    styleSrc,
    "style-src-attr 'unsafe-inline'",
    // The PDF viewer frames a signed media URL (or a blob of it).
    `frame-src ${["'self'", "blob:", ...mediaHosts()].join(" ")}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    `connect-src ${connect}`,
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = buildCsp(nonce, request.headers.get("host"), process.env.NODE_ENV !== "production");

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
      source: "/((?!api/v1|socket.io|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
