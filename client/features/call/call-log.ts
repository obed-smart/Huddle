/** A console trace of the call signaling and media flow. It prints while you
    are developing (npm run dev) and is silent in a production build, so it
    costs nothing and leaks nothing once shipped. Each line reads
    [call:<tag>] <event> then the payload, where tag is one of: recv (an event
    the socket received), send (a request we emit), ack (its ack), track (a
    remote track that arrived). */
export function clog(tag: string, event: string, data?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.log(`[call:${tag}] ${event}`, data ?? "");
}
