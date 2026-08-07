import ConversationsRepository from "./conversations.repository";
import { db } from "../../db";
import {
  conversationsTable,
  conversationParticipants,
  conversationTimeline,
  messagesTable,
  systemEventsTable,
} from "../../db/schema";
import { groupJoinRequestsTable } from "../../db/schema";
import ConversationService from "./conversations.services";
import ConversationController from "./conversation.controllers";
import { socketGateway } from "../../sockets/socket.gateway";
import logger from "../../shared/utils/logger";
import { usersTable } from "../../db/schema";

const conversationRepo = new ConversationsRepository(
  db,
  conversationsTable,
  conversationParticipants,
  groupJoinRequestsTable,
  usersTable,
  conversationTimeline,
  messagesTable,
  systemEventsTable,
);

const conversationService = new ConversationService(
  conversationRepo,
  logger,
  socketGateway,
);

const conversationController = new ConversationController(conversationService);

export { conversationController, conversationService };
