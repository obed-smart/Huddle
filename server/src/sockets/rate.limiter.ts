import { Socket } from "socket.io";
import { BucketConfig, checkLimit } from "../middlewares/rate.limiter";
import logger from "../shared/utils/logger";

type SocketMiddleware = Parameters<Socket["use"]>[0];

export const MESSAGE_LIMIT: BucketConfig = {
  maxTokens: 8,
  refillPerSecond: 1.5,
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

export function globalSocketRateLimit(userId: string): SocketMiddleware {
  return async ([event, ...args], next) => {
    try {
      const { allowed, remaining } = await checkLimit(
        `ratelimit:global:user:${userId}`,
        GLOBAL_SOCKET_LIMIT,
      );

      if (!allowed) {
        const err = new Error(
          "You're sending events too quickly. Please slow down.",
        ) as Error & { data?: unknown };

        err.data = {
          code: "RATE_LIMITED",
          scope: "global",
          event,
          retryAfter: secondsUntilOneToken(remaining, GLOBAL_SOCKET_LIMIT),
        };
        return next(err);
      }

      next();
    } catch (e) {
      // Redis down → fail OPEN for the global net (don't break chat over a limiter blip)
      logger.error({ e, userId }, "global rate limiter unavailable");
      next();
    }
  };
}
