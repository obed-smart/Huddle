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

router.get("/", authenticate, conversationController.getConversation);

router.post(
  "/ping",
  authenticate,
  validate(conversationIdSchema),
  conversationController.pingUser,
);

router.post(
  "/pings/:id/accept-response",
  authenticate,
  validate(conversationIdSchema, "params"),
  conversationController.acceptPing,
);

router.post(
  "/pings/:id/decline-response",
  authenticate,
  validate(conversationIdSchema, "params"),
  conversationController.declinePing,
);

router.post(
  "/groups",
  authenticate,
  validate(createGroupConversationSchema),
  conversationController.createGroup,
);

router.patch(
  "/invites/:requestId",
  authenticate,
  validate(groupRequestIdSchema, "params"),
  validate(joinRequestRespondSchema),
  conversationController.groupRequestRespond,
);

router.patch(
  "/:conversationId",
  authenticate,
  validate(conversationParamsSchema, "params"),
  validate(updateConversationSchema),
  requireGroupAdmin,
  conversationController.updateConversation,
);

router.patch(
  "/join-requests/:requestId",
  authenticate,
  validate(groupRequestIdSchema, "params"),
  validate(joinRequestResolveSchema),
  conversationController.groupRequestResolve,
);

router.patch(
  "/:conversationId/invite-code",
  authenticate,
  validate(conversationParamsSchema, "params"),
  requireGroupAdmin,
  conversationController.addInviteCode,
);

router.get(
  "/invites/:inviteCode",
  authenticate,
  validate(inviteCodeSchema, "params"),
  conversationController.getConversationByInviteCode,
);
router.post(
  "/invites/:inviteCode",
  authenticate,
  validate(inviteCodeSchema, "params"),
  conversationController.joinGroup,
);

router.post(
  "/invites",
  authenticate,
  validate(inviteUserSchema),
  conversationController.inviteUserToGroup,
);

router.get(
  "/:conversationId/requests",
  authenticate,
  requireGroupAdmin,
  conversationController.pendingJoinRequests,
);

router.get(
  "/:conversationId/messages",
  authenticate,
  validate(conversationParamsSchema, "params"),
  validate(timelineQuerySchema, "query"),
  conversationController.getMessages,
);

router.patch(
  "/:conversationId/participants/:userId/role",
  authenticate,
  validate(conversationUserSchemaParams, "params"),
  requireGroupAdmin,
  validate(updateAdminRoleSchema),
  conversationController.updateAdminRole,
);

router.delete(
  "/:conversationId/participants/me",
  authenticate,
  validate(leaveConversationSchema, "params"),
  conversationController.leaveConversation,
);

router.delete(
  "/:conversationId/participants/:userId",
  authenticate,
  requireGroupAdmin,
  validate(conversationUserSchemaParams, "params"),
  conversationController.removeMember,
);

router.delete(
  "/:conversationId",
  authenticate,
  requireGroupAdmin,
  validate(conversationParamsSchema, "params"),
  conversationController.deteleConversation,
);

export default router;
