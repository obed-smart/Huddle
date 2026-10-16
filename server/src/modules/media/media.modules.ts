import MediaRepository from "./media.repository";
import MediaService from "./media.services";
import MediaController from "./media.controllers";
import { db } from "../../db";
import { attachmentsTable, conversationParticipants, messagesTable } from "../../db/schema";

const mediaRepository = new MediaRepository(
  db,
  attachmentsTable,
  messagesTable,
  conversationParticipants
);
const mediaService = new MediaService(mediaRepository);
const mediaController = new MediaController(mediaService);

export { mediaService, mediaController };
