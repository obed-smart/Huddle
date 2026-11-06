import { readFileSync } from "node:fs";
import { join } from "node:path";
import type Redis from "ioredis";
import { NextFunction, Request, Response } from "express";
import {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
  RateLimiterUnion,
} from "rate-limiter-flexible";

import { ApiResponse } from "../shared/utils/apiResponse";
import logger from "../shared/utils/logger";
import AppError from "../shared/utils/apiError";
import redisClient from "../config/redis/redis.config";
import limiterRedis from "../config/redis.limiter";

export interface BucketConfig {
  maxTokens: number;
  refillPerSecond: number;
  keyTtlMs: number;
}

type KeyFn = (req: Request) => string | null;

const luascript = readFileSync(
  join(__dirname, "../config/token-bucket.lua"),
  "utf-8",
);

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

// export function rateLimit(
//   config: BucketConfig,
//   keyFn: (req: Request) => string,
// ) {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     let result: { allowed: boolean; remaining: number };

//     try {
//       result = await checkLimit(keyFn(req), config);
//     } catch (err) {
//       logger.error({ err }, "Rate limiter failed, allowing request");
//       return next(); // fail open
//     }

//     const { allowed, remaining } = result;
//     res.setHeader("X-RateLimit-Limit", config.maxTokens);
//     res.setHeader("X-RateLimit-Remaining", Math.floor(remaining));

//     if (!allowed) {
//       // Time until the bucket has 1 full token again
//       const retryAfter = Math.ceil((1 - remaining) / config.refillPerSecond);
//       res.setHeader("Retry-After", retryAfter);

//       return res.status(429).json(
//         ApiResponse.error({ message: "Too many requests: try again later" }),
//       );
//     }

//     next();
//   };
// }

export const makeLimiter = (
  keyPrefix: string,
  points: number,
  duration: number,
  blockDuration = 0,
) =>
  new RateLimiterRedis({
    storeClient: limiterRedis,
    keyPrefix,
    points,
    duration,
    blockDuration,
  });

const HARD_LIMIT = 300; // this is the hard limit for requests per minute, after which the user will be blocked

const SOFT_LIMIT = 120; // this is the soft limit for requests per minute, after which the user will be delayed

const MAX_DELAY_MS = 2000; // this is the maximum delay in milliseconds for requests after the soft limit is reached

export const globalLimiter = new RateLimiterRedis({
  storeClient: limiterRedis,
  keyPrefix: "rl_global",
  points: HARD_LIMIT,
  duration: 60,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function globalRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.ip || req.path === "/health") return next();

  try {
    const state = await globalLimiter.consume(req.ip);
    const used = HARD_LIMIT - state.remainingPoints;

    if (used > SOFT_LIMIT) {
      await sleep(Math.min((used - SOFT_LIMIT) * 10, MAX_DELAY_MS));
    }
  } catch (rejected: any) {
    if (rejected instanceof Error) {
      logger.error({ err: rejected }, "global limiter error");
      return next();
    }
    res.setHeader("Retry-After", Math.ceil(rejected.msBeforeNext / 1000));
    return res
      .status(429)
      .json(ApiResponse.error("Too many requests: try again later"));
  }

  next();
}

export const bodyFieldIpKey =
  (field: string, maxLength = 254): KeyFn =>
  (req) => {
    if (!req.ip) return null;

    const raw = req.body?.[field];

    logger.debug(`bodyFieldIpKey: field=${field}, raw=${raw}, 
      ip=${req.ip}`);

    logger.debug(`typeof raw: ${typeof raw}, value: ${raw}`);

    logger.debug(`length of raw: ${raw?.length}`);
    if (typeof raw !== "string") return null;
    const id = raw.toLowerCase().trim();
    if (!id || id.length > maxLength) return null;
    return `${id}:${req.ip}`;
  };

export const ipKey: KeyFn = (req) => req.ip ?? null;
export const loginKey = bodyFieldIpKey("identifier");
export const emailKey = bodyFieldIpKey("email");

export function rateLimit(limiter: RateLimiterRedis, getKey: KeyFn) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    if (!key) {
      return res.status(503).json(ApiResponse.error("Invalid request"));
    }

    try {
      await limiter.consume(key);
      next();
    } catch (rejected: any) {
      if (rejected instanceof Error) {
        logger.error(`rate limiter error: ${rejected}`);
        return res.status(503).json(ApiResponse.error("Service unavailable"));
      }

      res.setHeader("Retry-After", Math.ceil(rejected.msBeforeNext / 1000));
      return res
        .status(429)
        .json(ApiResponse.error("Too many requests: try again later"));
    }
  };
}

export function rateLimitFailures(
  limiter: RateLimiterRedis,
  getKey: KeyFn,
  localsName = "failureKey",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    if (!key) {
      return res.status(400).json(ApiResponse.error("Invalid request"));
    }

    res.locals[localsName] = key;

    try {
      const state = await limiter.get(key);

      if (state && state.remainingPoints <= 0) {
        res.setHeader("Retry-After", Math.ceil(state.msBeforeNext / 1000));
        return res
          .status(429)
          .json(ApiResponse.error("Too many attempts: try again later"));
      }
    } catch (err) {
      logger.error({ err }, "rate limiter error");
      return res.status(503).json(ApiResponse.error("Service unavailable"));
    }

    next();
  };
}
