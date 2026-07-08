import UserRepository from "./user.repository";
import { db } from "../../db";
import logger from "../../shared/utils/logger";
import { usersTable } from "../../db/schema/schema.user";
import UserService from "./user.services";
import UserController from "./user.controllers";

const userRepository = new UserRepository(db, logger, usersTable);
const userService = new UserService(userRepository, logger);
const userController = new UserController(userService);

export { userRepository, userService, userController };
