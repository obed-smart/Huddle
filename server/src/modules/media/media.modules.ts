import MediaRepository from "./media.repository";
import MediaService from "./media.services";
import MediaController from "./media.controllers";
import { db } from "../../db";

const mediaRepository = new MediaRepository(db);
const mediaService = new MediaService(mediaRepository);
const mediaController = new MediaController(mediaService);

export { mediaService, mediaController };
