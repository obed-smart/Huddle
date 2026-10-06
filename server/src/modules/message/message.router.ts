import { Router } from "express";
import { messageController } from "./message.modules";
import authenticate from "../../middlewares/authentication.middleware";

const router = Router();

router.use(authenticate);

router.post("/", messageController.createMessage);
router.get(
  "/conversation/:conversationId",
  messageController.getMessagesByConversation,
);
router.get("/:messageId", messageController.getMessageById);
router.put("/:messageId", messageController.updateMessage);
router.delete("/:messageId", messageController.deleteMessage);

export default router;
