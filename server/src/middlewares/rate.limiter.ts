import { readFileSync } from "node:fs";
import { join } from "node:path";
import type Redis from "ioredis";
import { NextFunction, Request, Response } from "express";

import redisClient from "../config/redis.config";
import { ApiResponse } from "../shared/utils/apiResponse";

 export interface BucketConfig {
  maxTokens: number;
  refillPerSecond: number;
  keyTtlMs: number;
}

const luascript = readFileSync(join(__dirname, "token-bucket.lua"), "utf-8");

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

async function checkLimit(
  key: string,
  config: BucketConfig,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const [allowed, remaining] = await redisClient.tokenBucket(
      key,
      config.maxTokens,
      config.refillPerSecond,
      Date.now(),
      config.keyTtlMs,
    );

    return {
      allowed: allowed === 1,
      remaining: parseFloat(remaining),
    };
  } catch (error) {
    throw error;
  }
}

export function rateLimit(
  config: BucketConfig,
  keyFn: (req: Request) => string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { allowed, remaining } = await checkLimit(keyFn(req), config);
    res.setHeader("x-RateLimit-Limit", config.maxTokens);
    res.setHeader("x-RateLimit-Remaining", Math.floor(remaining));

    if (!allowed) {
      res.setHeader("Retry-After", Math.ceil(1 / config.refillPerSecond));

      return res.status(429).json(
        ApiResponse.error({
          message: "Too many request : Try again later",
        }),
      );
    }
    next();
  };
}
