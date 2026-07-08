import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.router";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);

export default router;
