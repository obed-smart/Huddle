import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import env from "../env";
import {
  AddTracksBody,
  AddTracksResponse,
  CloseTracksResponse,
  RenegotiateResponse,
  SessionDescription,
} from "./cloudflare.rtc.types";

const BASE = env.CLOUDFLARE_BASE_URL;
const APP = env.CLOUDFLARE_RTC_APP_ID;
const SECRET = env.CLOUDFLARE_RTC_APP_SECRET;

async function cfg<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  try {
    const res = await fetch(`${BASE}/apps/${APP}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json",
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      logger.error(
        { status: res.status, path, method },
        "CF RTC request failed",
      );
      throw new AppError("Calling service unavailable", 502);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof AppError) throw err;

    const timedOut = err instanceof Error && err.name === "TimeoutError";
    logger.error({ err, path, method }, "CF RTC request error");
    throw new AppError("Calling service unavailable", timedOut ? 504 : 503);
  }
}
export const cfRtc = {
  newSession: () => cfg<{ sessionId: string }>("/sessions/new", "POST"),

  addTracks: (sessionId: string, body: AddTracksBody) =>
    cfg<AddTracksResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/tracks/new`,
      "POST",
      body,
    ),

  renegotiate: (sessionId: string, sdp: SessionDescription) =>
    cfg<RenegotiateResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/renegotiate`,
      "PUT",
      { sessionDescription: sdp },
    ),

  closeTracks: (sessionId: string, mids: string[]) =>
    cfg<CloseTracksResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/tracks/close`,
      "PUT",
      {
        tracks: mids.map((mid) => ({ mid })),
        force: true,
      },
    ),
};
