import { db } from "../../db";
import { refreshTokensTable } from "../../db/schema/schema.refreshTokens";
import logger from "../../shared/utils/logger";
import {userService } from "../user/user.modules";
import AuthController from "./auth.controllers";
import AuthRepository from "./auth.repository";
import AuthService from "./auth.services";

const authRepository = new AuthRepository(db, refreshTokensTable);

const authService = new AuthService(userService, logger, authRepository);

const authController = new AuthController(authService);

export { authController };
