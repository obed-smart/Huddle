import { Router } from "express";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import {
  conversationIdSchema,
  conversationParamsSchema,
  conversationUserSchemaParams,
  createGroupConversationSchema,
  groupRequestIdSchema,
  inviteCodeSchema,
  inviteUserSchema,
  joinRequestResolveSchema,
  joinRequestRespondSchema,
  leaveConversationSchema,
  timelineQuerySchema,
  updateAdminRoleSchema,
  updateConversationSchema,
} from "./conversations.validation";
import { conversationController } from "./conversations.modules";
import { requireGroupAdmin } from "./conversation.middleware";

const router = Router();

router.use(authenticate);

router.get("/", conversationController.getConversation);

router.post(
  "/ping",
  validate(conversationIdSchema),
  conversationController.pingUser,
);

router.post(
  "/pings/:id/accept",
  validate(conversationIdSchema, "params"),
  conversationController.acceptPing,
);

router.post(
  "/pings/:id/decline",
  validate(conversationIdSchema, "params"),
  conversationController.declinePing,
);

router.post(
  "/groups",
  validate(createGroupConversationSchema),
  conversationController.createGroup,
);

router.patch(
  "/invites/:requestId",
  validate(groupRequestIdSchema, "params"),
  validate(joinRequestRespondSchema),
  conversationController.groupRequestRespond,
);

router.patch(
  "/:conversationId",
  validate(conversationParamsSchema, "params"),
  validate(updateConversationSchema),
  requireGroupAdmin,
  conversationController.updateConversation,
);

router.patch(
  "/join-requests/:requestId",
  validate(groupRequestIdSchema, "params"),
  validate(joinRequestResolveSchema),
  conversationController.groupRequestResolve,
);

router.patch(
  "/:conversationId/invite-code",
  validate(conversationParamsSchema, "params"),
  requireGroupAdmin,
  conversationController.addInviteCode,
);

router.get(
  "/invites/:inviteCode",
  validate(inviteCodeSchema, "params"),
  conversationController.getConversationByInviteCode,
);
router.post(
  "/invites/:inviteCode",
  validate(inviteCodeSchema, "params"),
  conversationController.joinGroup,
);

router.post(
  "/invites",
  validate(inviteUserSchema),
  conversationController.inviteUserToGroup,
);

router.get(
  "/:conversationId/requests",
  requireGroupAdmin,
  conversationController.pendingJoinRequests,
);

router.get(
  "/:conversationId/messages",
  validate(conversationParamsSchema, "params"),
  validate(timelineQuerySchema, "query"),
  conversationController.getMessages,
);

router.patch(
  "/:conversationId/participants/:userId/role",
  validate(conversationUserSchemaParams, "params"),
  requireGroupAdmin,
  validate(updateAdminRoleSchema),
  conversationController.updateAdminRole,
);

router.delete(
  "/:conversationId/participants/me",

  validate(leaveConversationSchema, "params"),
  conversationController.leaveConversation,
);

router.delete(
  "/:conversationId/participants/:userId",
  requireGroupAdmin,
  validate(conversationUserSchemaParams, "params"),
  conversationController.removeMember,
);

router.delete(
  "/:conversationId",
  requireGroupAdmin,
  validate(conversationParamsSchema, "params"),
  conversationController.deteleConversation,
);

export default router;
