import crypto from "crypto";
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
    const familyId = crypto.randomUUID();

    return {
      accessToken,
      refreshToken,
      familyId,
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    familyId: string,
  ) {
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_LIFESPAN_DAYS);

    const hashTokens = hashToken(refreshToken);

    await this.authRepo.create({
      userId,
      familyId,
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

    const { accessToken, refreshToken, familyId } = this.generateToken(user);

    const expiresAt = await this.storeRefreshToken(
      user.id,
      refreshToken,
      familyId,
    );

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async login(user: IUser) {
    const { accessToken, refreshToken, familyId } = this.generateToken(user);

    const expiresAt = await this.storeRefreshToken(
      user.id,
      refreshToken,
      familyId,
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async logout(token: string) {
    const tokenHash = hashToken(token);
    await this.authRepo.revokeRefreshToken(tokenHash);
  }

  async logOutAll(userId: string) {
    await this.authRepo.revokeAllRefreshTokens(userId);
  }

  async googleCallback(user: AuthUser) {
    const { accessToken, refreshToken, familyId } = this.generateToken(user);

    this.logger.info(`User ${user.id} logged in with Google`);

    const expiresAt = await this.storeRefreshToken(
      user.id,
      refreshToken,
      familyId,
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async refresh(token: string) {
    const tokenHash = hashToken(token);

    const existing = await this.authRepo.findByTokenHash(tokenHash);

    if (!existing) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (existing.revokedAt) {
      await this.authRepo.revokeFamily(existing.familyId);
      this.logger.warn(
        `Refresh reuse detected, user: ${existing.userId}, familyId: ${existing.familyId} `,
      );
      throw new AppError("Session invalid, please login again", 401);
    }

    if (existing.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401);
    }

    await this.authRepo.revokeById(existing.id);
    const user = await this.userService.findAuthUserById(existing.userId);
    const { accessToken, refreshToken } = this.generateToken(user);

    const expiresAt = await this.storeRefreshToken(
      user.id,
      refreshToken,
      existing.familyId,
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}

export default AuthService;
