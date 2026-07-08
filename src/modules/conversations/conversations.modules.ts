import ConversationsRepository from "./conversations.repository";
import { db } from "../../db";
import { conversationsTable } from "../../db/schema";

const conversationRepo = new ConversationsRepository(db, conversationsTable);

// const 
