/** A console trace of the call signaling and media flow. Noisy on purpose: it
    is a diagnostic so the whole flow can be followed from the browser console
    on a real device. Each line is [call:<tag>] <event>, then the payload.
      recv  an event the socket received      send  a request we emit
      ack   the ack for a request we emit     track a remote track that arrived */
export function clog(tag: string, event: string, data?: unknown) {
  console.log(`[call:${tag}] ${event}`, data ?? "");
}
