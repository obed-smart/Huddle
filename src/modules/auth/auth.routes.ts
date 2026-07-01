import { Router } from "express";
import { authController } from "./auth.modules";
import passport from "passport";

const router = Router();

router.post("/register", authController.register);
router.post(
  "/login",
  //   validate(LoginSchema),
  passport.authenticate("local", { session: false, failWithError: true }),
  authController.login,
);

export default router;
