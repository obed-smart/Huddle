import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const isDev = process.env.NODE_ENV === "development";

/**
 * The backend origin stays server-only (never NEXT_PUBLIC): it is read here, on
 * the server, and used only to proxy same-origin `/api/v1` and `/socket.io`
 * requests to the real backend. The browser only ever sees same-origin paths,
 * so no backend URL reaches the shipped bundle. When unset (e.g. the API is
 * already served same-origin by a reverse proxy) the rewrites are a no-op.
 */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN?.replace(/\/+$/, "");

// Each directive lists the sources the browser may load that resource type from.
const csp = [
  "default-src 'self'",
  // Next injects small inline scripts; dev mode also needs eval for hot reload.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // fetch/XHR/WebSocket targets. Same-origin because of the proxy rewrites.
  `connect-src 'self' ws: wss:`,
  // <video>/<audio> playing MediaStreams or recordings use blob: URLs.
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Modern replacement for X-Frame-Options.
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Calls need the camera/mic from this origin; nothing else.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  // HTTPS only: browsers ignore HSTS over plain HTTP, and you don't want it in dev.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder: the repo also has a lockfile at its
  // root, which would otherwise make Next guess the wrong root.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },

  allowedDevOrigins: ["10.18.66.217"],

  async rewrites() {
    if (!BACKEND_ORIGIN) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${BACKEND_ORIGIN}/socket.io/:path*`,
      },
    ];
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
