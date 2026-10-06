import { db } from "../../db";
import { callParticipant, callTable, conversationsTable, usersTable } from "../../db/schema";
import CallControllers from "./call.controllers";
import CallRepository from "./call.repository";
import CallService from "./call.services";
import { callEvent } from "./call.event";

const callRepository = new CallRepository(
  db,
  callTable,
  callParticipant,
  usersTable,
  conversationsTable
);

const callService = new CallService(callRepository);
const callController = new CallControllers(callService);

export { callService, callController, callEvent };
