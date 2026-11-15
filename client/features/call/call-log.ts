/** A console trace of the call signaling and media flow. Off in production, so
    it costs nothing and leaks nothing there; always on in development. To turn
    it on against a production build (a dev tunnel, say), run
      localStorage.callDebug = "1"
    in the browser console and reload. Each line is [call:<tag>] <event>, then
    the payload: recv (an event received), send (a request we emit), ack (its
    ack), track (a remote track that arrived). */
function enabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  try {
    return localStorage.getItem("callDebug") === "1";
  } catch {
    return false;
  }
}

export function clog(tag: string, event: string, data?: unknown) {
  if (!enabled()) return;
  console.log(`[call:${tag}] ${event}`, data ?? "");
}
