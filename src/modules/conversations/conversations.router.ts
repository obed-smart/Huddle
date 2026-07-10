import { Router } from "express";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { conversationIdSchema } from "./conversations.validation";
import { conversationController } from "./conversations.modules";

const router = Router();

router.post(
  "/ping",
  authenticate,
  validate(conversationIdSchema),
  conversationController.pingUser,
);

router.post(
  "/:id/accept",
  authenticate,
  validate(conversationIdSchema, "params"),
  conversationController.acceptPing,
);

router.post(
  "/:id/decline",
  authenticate,
  validate(conversationIdSchema, "params"),
  conversationController.declinePing,
);

export default router;
