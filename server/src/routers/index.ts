import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.router";
import conversationRoutes from "../modules/conversations/conversations.router";
import callRouter from "../modules/call/call.router";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/conversation", conversationRoutes);
router.use("/call", callRouter);

export default router;
