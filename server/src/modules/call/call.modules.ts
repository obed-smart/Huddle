import { db } from "../../db";
import { callParticipant, callTable } from "../../db/schema";
import CallRepository from "./call.repository";
import CallService from "./call.services";

const callRepository = new CallRepository(db, callTable, callParticipant);

const callService = new CallService(callRepository);

export { callService };
