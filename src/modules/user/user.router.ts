import { Router } from "express";
import { userController } from "./user.modules";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { searchUserSchema } from "./user.validation";
import { conversationController } from "../conversations/conversations.modules";

const router = Router();

router.get("/me", authenticate, userController.getMe);
router.get(
  "/search",
  authenticate,
  validate(searchUserSchema, "query"),
  userController.searchUsers,
);

router.get(
  "/:username",
  authenticate,
  validate(searchUserSchema, "params"),
  userController.getUserByUsername,
);

router.get(
  "/me/pending-invites",
  authenticate,
  conversationController.pendingGroupInvites,
);

export default router;
