import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.router";
import conversationRoutes from "../modules/conversations/conversations.router";
import callRouter from "../modules/call/call.router";
import meetRouter from "../modules/meets/meet.router";
import mediaRouter from "../modules/media/media.routers";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/conversation", conversationRoutes);
router.use("/call", callRouter);
router.use("/meet", meetRouter);
router.use("/media", mediaRouter);

export default router;
