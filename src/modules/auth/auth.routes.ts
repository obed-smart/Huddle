import { Router } from "express";
import { authController } from "./auth.modules";
import passport from "passport";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { loginSchema, registerSchema } from "./auth.validation";
import AppError from "../../shared/utils/apiError";

const router = Router();

router.post(
  "/register",
  validate(registerSchema, "body"),
  authController.register,
);
router.post(
  "/login",
  validate(loginSchema, "body"),
  (req, res, next) => {
    passport.authenticate(
      "local",
      { session: false },
      (
        err: Error | null,
        user: Express.User | false,
        info: { message?: string },
      ) => {
        if (err) return next(err);
        if (!user) {
          throw new AppError(`${info?.message  || "Unauthorized"}`, 401);
        }
        req.user = user;
        next();
      },
    )(req, res, next);
  },
  authController.login,
);

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

export default router;
