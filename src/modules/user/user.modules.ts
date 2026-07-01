import UserRepository from "./user.repository";
import { db } from "../../db";
import logger from "../../shared/utils/logger";
import { usersTable } from "../../db/schema/schema.user";

const userRepository = new UserRepository(db, logger, usersTable);

export { userRepository };
