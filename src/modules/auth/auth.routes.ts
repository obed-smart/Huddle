import { Router } from "express";
import { authController } from "./auth.modules";
import passport from "passport";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { loginSchema, registerSchema } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validate(registerSchema, "body"),
  authController.register,
);
router.post(
  "/login",
  validate(loginSchema, "body"),
  passport.authenticate("local", { session: false, failWithError: true }),
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
