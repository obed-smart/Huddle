import { Router } from "express";
import { authController } from "./auth.modules";
import passport from "passport";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import {
  forgetPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation";
import AppError from "../../shared/utils/apiError";

import logger from "../../shared/utils/logger";
import { RateLimiterRes } from "rate-limiter-flexible";
import {
  forgotEmailDailyLimiter,
  forgotEmailIpLimiter,
  forgotIpLimiter,
  loginAttemptLimiter,
  loginRateLimiter,
  refreshIpLimiter,
  registerRateLimiter,
  resendEmailDailyLimiter,
  resendEmailHourlyLimiter,
  resendIpLimiter,
  resetEmailLimiter,
  resetIpLimiter,
  verifyIpLimiter,
} from "./auth.rate.limiter";
import { emailKey, ipKey, rateLimit } from "../../middlewares/rate.limiter";

const router = Router();

router.post(
  "/register",
  registerRateLimiter,
  validate(registerSchema, "body"),
  authController.register,
);
router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema, "body"),
  (req, res, next) => {
    const key = res.locals.loginKey as string;

    passport.authenticate(
      "local",
      { session: false },
      async (
        err: Error | null,
        user: Express.User | false,
        info: { message?: string },
      ) => {
        try {
          if (err) return next(err);

          if (!user && info?.message === "invalid credentials") {
            try {
              logger.debug(`Login attempt failed for key: ${key}`);
              logger.error(
                `Login attempt failed for key: ${key}, reason: ${info?.message}`,
              );

              const res = await loginAttemptLimiter.consume(key);

              logger.debug(
                `login failure counted: key=${key} used=${res.consumedPoints} left=${res.remainingPoints} resetsInMs=${res.msBeforeNext}`,
              );
            } catch (e) {
              if (e instanceof Error) {
                logger.error(`limiter consume failed: ${e}`);
              } else {
                const r = e as RateLimiterRes;
                logger.debug(
                  `login failure counted, limit reached: key=${key} used=${r.consumedPoints} blockedForMs=${r.msBeforeNext}`,
                );
              }
            }
            return next(new AppError("invalid credentials", 401));
          }

          await loginAttemptLimiter
            .delete(key)
            .catch((e) => logger.error(`limiter delete: ${e}`));

          if (!user) {
            // unverified email
            return next(new AppError(info?.message || "Unauthorized", 401));
          }

          req.user = user;
          next();
        } catch (e) {
          next(e);
        }
      },
    )(req, res, next);
  },
  authController.login,
);

router.post("/logout", authenticate, authController.logout);
router.post("/logoutAll", authenticate, authController.logOutAll);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/login",
  }),
  authController.googleCallback,
);

router.post(
  "/refresh",
  rateLimit(refreshIpLimiter, ipKey),
  authController.refresh,
);
router.post(
  "/forgot-password",
  rateLimit(forgotIpLimiter, ipKey),
  validate(forgetPasswordSchema),
  rateLimit(forgotEmailIpLimiter, emailKey),
  rateLimit(forgotEmailDailyLimiter, emailKey),
  authController.forgetPassword,
);

router.post(
  "/reset-password",
  rateLimit(resetIpLimiter, ipKey),
  validate(resetPasswordSchema),
  rateLimit(resetEmailLimiter, emailKey),
  authController.resetPassword,
);

router.post(
  "/verify-email",
  rateLimit(verifyIpLimiter, ipKey),
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

router.post(
  "/resend-verification",
  validate(forgetPasswordSchema),
  authController.resendVerificationEmail,
);

router.post(
  "/resend-verification",
  rateLimit(resendIpLimiter, ipKey),
  validate(resendVerificationSchema),
  rateLimit(resendEmailHourlyLimiter, emailKey),
  rateLimit(resendEmailDailyLimiter, emailKey),
  authController.resendVerificationEmail,
);

export default router;
