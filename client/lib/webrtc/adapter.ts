import type { IAdapter } from "webrtc-adapter";

let promise: Promise<IAdapter | null> | null = null;

/**
 * webrtc-adapter normalizes the browser WebRTC APIs (RTCPeerConnection,
 * getUserMedia, tracks and stats) to one modern shape, so the call code is
 * written once and behaves the same across Chrome, Safari and Firefox.
 *
 * Importing it patches the globals and touches `window`, so it is pulled in as
 * its own client-only chunk, once, behind this loader. Await it before creating
 * the first RTCPeerConnection so the shims are already in place. It resolves to
 * null on the server.
 */
export function ensureWebrtcAdapter(): Promise<IAdapter | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  promise ??= import("webrtc-adapter").then((mod) => {
    const adapter = mod.default;
    // Keep production consoles quiet; the shim is noisy by default.
    if (process.env.NODE_ENV === "production") adapter.disableWarnings(true);
    return adapter;
  });
  return promise;
}

/**
 * The browser the shim detected (name and version), for call-time quirk
 * handling. Null on the server, or if the adapter could not load.
 */
export async function getBrowserDetails() {
  const adapter = await ensureWebrtcAdapter();
  return adapter?.browserDetails ?? null;
}
