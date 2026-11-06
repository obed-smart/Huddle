import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import env from "../env";
import { CfIceServer, CfTurnResponse } from "./cloudflare.rtc.types";

export async function getTurnCredentials(): Promise<CfIceServer[]> {
  try {
    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.CLOUDFLARE_TURN_TOKEN_ID}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 3600 }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      throw new Error(`CF TURN responded ${res.status}`);
    }

    const { iceServers } = (await res.json()) as CfTurnResponse;
    return iceServers;
  } catch (err) {
    logger.error({ err }, "failed to get TURN credentials");
    throw new AppError("Calling service unavailable", 503);
  }
}
