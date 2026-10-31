import { readFileSync } from "node:fs";
import { join } from "node:path";
import type Redis from "ioredis";
import { NextFunction, Request, Response } from "express";

import redisClient from "../config/redis.config";
import { ApiResponse } from "../shared/utils/apiResponse";
import logger from "../shared/utils/logger";

 export interface BucketConfig {
  maxTokens: number;
  refillPerSecond: number;
  keyTtlMs: number;
}

const luascript = readFileSync(
  join(__dirname, "../config/token-bucket.lua"),
  "utf-8",
);;

declare module "ioredis" {
  interface RedisCommander<Context> {
    tokenBucket(
      key: string,
      maxTokens: number,
      refillPerSecond: number,
      nowMs: number,
      keyTtlMs: number,
    ): Promise<[number, string]>;
  }
}

export function registerRateLimiterBucket(redis: Redis) {
  redis.defineCommand("tokenBucket", {
    numberOfKeys: 1,
    lua: luascript,
  });
}

export async function checkLimit(key: string, config: BucketConfig) {
  const [allowed, remaining] = await redisClient.tokenBucket(
    key,
    config.maxTokens,
    config.refillPerSecond,
    Date.now(),
    config.keyTtlMs,
  );

  return { allowed: allowed === 1, remaining: parseFloat(remaining) };
}

export function rateLimit(
  config: BucketConfig,
  keyFn: (req: Request) => string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let result: { allowed: boolean; remaining: number };

    try {
      result = await checkLimit(keyFn(req), config);
    } catch (err) {
      logger.error({ err }, "Rate limiter failed, allowing request");
      return next(); // fail open
    }

    const { allowed, remaining } = result;
    res.setHeader("X-RateLimit-Limit", config.maxTokens);
    res.setHeader("X-RateLimit-Remaining", Math.floor(remaining));

    if (!allowed) {
      // Time until the bucket has 1 full token again
      const retryAfter = Math.ceil((1 - remaining) / config.refillPerSecond);
      res.setHeader("Retry-After", retryAfter);

      return res.status(429).json(
        ApiResponse.error({ message: "Too many requests: try again later" }),
      );
    }

    next();
  };
}
