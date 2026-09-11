import Logger from "../../shared/utils/logger";
import { INewUser, IUser } from "../../db/schema/schema.user";
import AppError from "../../shared/utils/apiError";

import authRepository from "./auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
} from "../../shared/utils/utits";
import UserService from "../user/user.services";
import { AuthUser } from "../../shared/types";

export const REFRESH_TOKEN_LIFESPAN_DAYS = 7;

class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: typeof Logger,
    private readonly authRepo: authRepository,
  ) {}

  private generateToken(user: AuthUser) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    return {
      accessToken,
      refreshToken,
    };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_LIFESPAN_DAYS);

    const hashTokens = hashToken(refreshToken);

    await this.authRepo.create({
      userId: userId,
      tokenHash: hashTokens,
      expiresAt: expiresAt,
    });

    return expiresAt;
  }

  async register(userData: INewUser) {
    const user = await this.userService.createUser({
      ...userData,
      provider: "local",
    });

    const { accessToken, refreshToken } = this.generateToken(user);

    const expiresAt = await this.storeRefreshToken(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async login(user: IUser) {
    const { accessToken, refreshToken } = this.generateToken(user);

    const expiresAt = await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async logout(refreshToken: string) {
    await this.authRepo.revokeRefreshToken(refreshToken);
  }

  async googleCallback(user: AuthUser) {
    const { accessToken, refreshToken } = this.generateToken(user);

    this.logger.info(`User ${user.id} logged in with Google`);

    const expiresAt = await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}

export default AuthService;
