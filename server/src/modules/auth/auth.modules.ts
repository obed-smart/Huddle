import { db } from "../../db";
import { usersTable } from "../../db/schema";
import {
  refreshTokensTable,
  sessionsTable,
} from "../../db/schema/schema.session";
import logger from "../../shared/utils/logger";
import { userService } from "../user/user.modules";
import AuthController from "./auth.controllers";
import AuthRepository from "./auth.repository";
import AuthService from "./auth.services";

const authRepository = new AuthRepository(
  db,
  sessionsTable,
  refreshTokensTable,
  usersTable
);

const authService = new AuthService(userService, logger, authRepository);

const authController = new AuthController(authService);

export { authService, authController };
