import { Socket } from "socket.io";
import { BucketConfig, checkLimit } from "../middlewares/rate.limiter";
import logger from "../shared/utils/logger";

type SocketMiddleware = Parameters<Socket["use"]>[0];

export const MESSAGE_LIMIT: BucketConfig = {
  maxTokens: 10,
  refillPerSecond: 2,
  keyTtlMs: 60_000,
};

// export const SESSION_MESSAGE_LIMIT: BucketConfig = {
//   maxTokens: 20,
//   refillPerSecond: 4,
//   keyTtlMs: 60_000,
// };

export const GLOBAL_SOCKET_LIMIT: BucketConfig = {
  maxTokens: 50,
  refillPerSecond: 25,
  keyTtlMs: 60_000,
};

export function secondsUntilOneToken(
  remaining: number,
  cfg: BucketConfig,
): number {
  if (remaining >= 1) return 0;
  const deficit = 1 - remaining;
  return Math.ceil(deficit / cfg.refillPerSecond);
}

export function globalSocketRateLimit(
  socket: Socket,
  userId: string,
): SocketMiddleware {
  return async ([event, ...args], next) => {
    try {
      const { allowed, remaining } = await checkLimit(
        `ratelimit:global:user:${userId}`,
        GLOBAL_SOCKET_LIMIT,
      );

      if (!allowed) {
        const payload = {
          code: "RATE_LIMITED",
          scope: "global",
          event,
          message: "You're sending events too quickly. Please slow down.",
          retryAfter: secondsUntilOneToken(remaining, GLOBAL_SOCKET_LIMIT),
        };

        // if the client sent an ack callback, answer through it
        const ack = args[args.length - 1];
        if (typeof ack === "function") {
          ack({ ok: false, error: payload });
        } else {
          socket.emit("rate_limited", payload);
        }
        return;
      }

      next();
    } catch (e) {
      logger.error({ e, userId }, "global rate limiter unavailable");
      next(); // fail open
    }
  };
}
