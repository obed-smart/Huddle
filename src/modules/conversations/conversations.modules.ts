import ConversationsRepository from "./conversations.repository";
import { db } from "../../db";
import { conversationsTable, conversationParticipants } from "../../db/schema";
import ConversationService from "./conversations.services";
import ConversationController from "./conversation.controllers";

const conversationRepo = new ConversationsRepository(
  db,
  conversationsTable,
  conversationParticipants,
);

const conversationService = new ConversationService(conversationRepo);

const conversationController = new ConversationController(conversationService);

export { conversationController };
