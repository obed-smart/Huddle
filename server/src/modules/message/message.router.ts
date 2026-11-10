import { Router } from "express";
import { messageController } from "./message.modules";
import authenticate from "../../middlewares/authentication.middleware";
import { rateLimit, userKey } from "../../middlewares/rate.limiter";
import { messageLimiter } from "./message.rate.limiter";

const router = Router();

router.use(authenticate);
router.use(rateLimit(messageLimiter, userKey, { failOpen: true }));

router.post("/", messageController.createMessage);
router.get(
  "/conversation/:conversationId",
  messageController.getMessagesByConversation,
);
router.get("/:messageId", messageController.getMessageById);
router.put("/:messageId", messageController.updateMessage);
router.delete("/:messageId", messageController.deleteMessage);

export default router;
