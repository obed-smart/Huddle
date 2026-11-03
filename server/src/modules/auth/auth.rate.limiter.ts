import { NextFunction, Request, Response } from "express";

import { ApiResponse } from "../../shared/utils/apiResponse";
import logger from "../../shared/utils/logger";
import {
  emailKey,
  ipKey,
  loginKey,
  makeLimiter,
} from "../../middlewares/rate.limiter";

const loginIpLimiter = makeLimiter("rl_login_ip", 50, 60);
export const loginAttemptLimiter = makeLimiter(
  "rl_login_attempt",
  5,
  15 * 60,
  15 * 60,
);

const registerIpLimiter = makeLimiter("rl_register_ip", 20, 60 * 60, 60 * 60);

const registerEmailLimiter = makeLimiter(
  "rl_register_email",
  5,
  60 * 60,
  60 * 60,
);

export async function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = loginKey(req);
  const ip = ipKey(req);

  if (!key || !ip) {
    return res.status(503).json(ApiResponse.error("Invalid request"));
  }
  res.locals.loginKey = key;

  try {
    const [, emailState] = await Promise.all([
      loginIpLimiter.consume(ip),
      loginAttemptLimiter.get(key),
    ]);

    if (emailState && emailState.remainingPoints <= 0) {
      res.setHeader("Retry-After", Math.ceil(emailState.msBeforeNext / 1000));
      return res
        .status(429)
        .json(ApiResponse.error("Too many attempts: try again later"));
    }

    next();
  } catch (rejected: any) {
    if (rejected instanceof Error) {
      return res.status(503).json(ApiResponse.error("Service unavailable"));
    }

    res.setHeader("Retry-After", Math.ceil(rejected.msBeforeNext / 1000));
    return res
      .status(429)
      .json(ApiResponse.error("Too many requests: try again later"));
  }
}

// export async function registerRateLimiter(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   const ip = ipKey(req);
//   const email = emailKey(req);

//   if (!ip || !email) {
//     return res.status(503).json(ApiResponse.error("Invalid request"));
//   }

//   try {
//     const results = await Promise.allSettled([
//       registerIpLimiter.consume(ip),
//       registerEmailLimiter.consume(email),
//     ]);

//     const ipRejected = results[0].status === "rejected";
//     const emailRejected = results[1].status === "rejected";

//     if (ipRejected || emailRejected) {
//       await Promise.allSettled([
//         !ipRejected ? registerIpLimiter.reward(ip) : Promise.resolve(),
//         !emailRejected ? registerEmailLimiter.reward(email) : Promise.resolve(),
//       ]);
//     }

//     const ipReason = ipRejected
//       ? (results[0] as PromiseRejectedResult).reason
//       : null;
//     const emailReason = emailRejected
//       ? (results[1] as PromiseRejectedResult).reason
//       : null;

//     if (ipReason instanceof Error || emailReason instanceof Error) {
//       logger.error(`register rate limiter error: ${ipReason ?? emailReason}`);
//       return res.status(503).json(ApiResponse.error("Service unavailable"));
//     }

//     const reason = (ipReason ?? emailReason) as { msBeforeNext: number };

//     res.setHeader("Retry-After", Math.ceil(reason.msBeforeNext / 1000));
//     res
//       .status(429)
//       .json(
//         ApiResponse.error("Too many requests: try again later"),
//       );

//     next();
//   } catch (rejected: any) {
//     if (rejected instanceof Error) {
//       logger.error(`rate limiter error: ${rejected}`);
//       return res.status(503).json(ApiResponse.error("Service unavailable"));
//     }

//     res.setHeader("Retry-After", Math.ceil(rejected.msBeforeNext / 1000));

//     return res
//       .status(429)
//       .json(ApiResponse.error("Too many requests: try again later"));
//   }
// }

export async function registerRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ip = ipKey(req);
  const email = emailKey(req);

  if (!ip || !email) {
    return res.status(400).json(ApiResponse.error("Invalid request"));
  }

  try {
    const results = await Promise.allSettled([
      registerIpLimiter.consume(ip),
      registerEmailLimiter.consume(email),
    ]);

    const ipRejected = results[0].status === "rejected";
    const emailRejected = results[1].status === "rejected";

    if (ipRejected || emailRejected) {
      await Promise.allSettled([
        !ipRejected ? registerIpLimiter.reward(ip) : Promise.resolve(),
        !emailRejected ? registerEmailLimiter.reward(email) : Promise.resolve(),
      ]);

      const ipReason = ipRejected
        ? (results[0] as PromiseRejectedResult).reason
        : null;
      const emailReason = emailRejected
        ? (results[1] as PromiseRejectedResult).reason
        : null;

      if (ipReason instanceof Error || emailReason instanceof Error) {
        logger.error(`register rate limiter error: ${ipReason ?? emailReason}`);
        return res.status(503).json(ApiResponse.error("Service unavailable"));
      }

      const waits = [ipReason, emailReason]
        .filter(
          (reason): reason is { msBeforeNext: number } =>
            reason !== null && !(reason instanceof Error),
        )
        .map((reason) => reason.msBeforeNext);
      res.setHeader("Retry-After", Math.ceil(Math.max(...waits) / 1000));

      return res
        .status(429)
        .json(ApiResponse.error("Too many requests: try again later"));
    }

    next();
  } catch (err) {
    logger.error(`register rate limiter unexpected error: ${err}`);
    return res.status(503).json(ApiResponse.error("Service unavailable"));
  }
}
