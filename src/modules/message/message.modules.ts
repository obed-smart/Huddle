import { db } from "../../db";
import logger from "../../shared/utils/logger";
import MessageController from "./message.controllers";
import MessageRepository from "./message.repository";
import MessageService from "./message.services";

const messageRepository = new MessageRepository(db);

const messageService = new MessageService(messageRepository, logger);

const messageController = new MessageController(messageService);

export { messageController, messageService, messageRepository };
