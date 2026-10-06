import { db } from "../../db";
import { meetParticipantTable, meetTable } from "../../db/schema/schema.meet";
import { socketGateway } from "../../sockets/socket.gateway";
import MeetController from "./meet.controllers";
import MeetRepository from "./meet.repository";
import MeetService from "./meet.services";
import { meetEvent } from "./meet.event";

const meetRepository = new MeetRepository(db, meetTable, meetParticipantTable);

const meetService = new MeetService(meetRepository, socketGateway);

const meetController = new MeetController(meetService);

export { meetController, meetService, meetEvent };
