import { Router } from "express";
import { userController } from "./user.modules";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { searchUserSchema } from "./user.validation";
import { conversationController } from "../conversations/conversations.modules";
import { rateLimit, userKey } from "../../middlewares/rate.limiter";
import { userLimiter } from "./user.rate.limiter";

const router = Router();

router.use(authenticate);
router.use(rateLimit(userLimiter, userKey, { failOpen: true }));

router.get("/me", userController.getMe);
router.get(
  "/search",
  validate(searchUserSchema, "query"),
  userController.searchUsers,
);

router.get(
  "/:username",

  validate(searchUserSchema, "params"),
  userController.getUserByUsername,
);

router.get("/me/pending-invites", conversationController.pendingGroupInvites);

export default router;
