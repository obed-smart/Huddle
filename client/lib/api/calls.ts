import { request } from "./http";
import { paths } from "./config";
import type { CallLogEntry } from "./types";

/** The signed-in user's call history. The server interprets each row (direction,
    label, count, avatar), so the client renders what it is given. The envelope's
    data holds `callLog` (tolerating an older `callLOg` spelling). */
export async function fetchCallLog(): Promise<CallLogEntry[]> {
  const data = await request<{ callLog?: CallLogEntry[]; callLOg?: CallLogEntry[] }>(paths.calls);
  return data?.callLog ?? data?.callLOg ?? [];
}
