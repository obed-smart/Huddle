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

export const resendIpLimiter = makeLimiter("rl_resend_ip", 20, 60 * 60);

export const resendEmailHourlyLimiter = makeLimiter(
  "rl_resend_email_h",
  5,
  60 * 60,
);

export const resendEmailDailyLimiter = makeLimiter(
  "rl_resend_email_d",
  10,
  60 * 60 * 24,
);

// forgot password
export const forgotIpLimiter = makeLimiter("rl_forgot_ip", 20, 60 * 60);
export const forgotEmailIpLimiter = makeLimiter(
  "rl_forgot_email_ip",
  5,
  60 * 60,
  60 * 60,
);
export const forgotEmailDailyLimiter = makeLimiter(
  "rl_forgot_email_d",
  10,
  60 * 60 * 24,
);

export const verifyIpLimiter = makeLimiter("rl_verify_ip", 20, 60 * 60);

export const verifyAttemptLimiter = makeLimiter(
  "rl_verify_attempt",
  5,
  60 * 60,
  60 * 60,
);

export const resetIpLimiter = makeLimiter("rl_reset_ip", 20, 60 * 60);

export const resetEmailLimiter = makeLimiter("rl_reset_email", 5, 60 * 15);

export const refreshIpLimiter = makeLimiter("rl_refresh_ip", 200, 60 * 60);

export async function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = loginKey(req);
  const ip = ipKey(req);

  if (!key || !ip) {
    return res.status(400).json(ApiResponse.error("Invalid request"));
  }
  res.locals.loginKey = key;

  try {
    const [, emailState] = await Promise.all([
      loginIpLimiter.consume(ip),
      loginAttemptLimiter.get(key),
    ]);

    if (emailState && emailState.remainingPoints <= 0) {
      await loginIpLimiter.reward(ip).catch(() => {});

      res.setHeader("Retry-After", Math.ceil(emailState.msBeforeNext / 1000));
      return res
        .status(429)
        .json(ApiResponse.error("Too many attempts: try again later"));
    }
  } catch (rejected: any) {
    if (rejected instanceof Error) {
      logger.error({ err: rejected }, "login rate limiter error");
      return res.status(503).json(ApiResponse.error("Service unavailable"));
    }

    res.setHeader("Retry-After", Math.ceil(rejected.msBeforeNext / 1000));
    return res
      .status(429)
      .json(ApiResponse.error("Too many requests: try again later"));
  }

  next();
}

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
