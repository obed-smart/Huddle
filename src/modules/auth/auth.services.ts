import userRepository from "../user/user.repository";
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

export const REFRESH_TOKEN_LIFESPAN_DAYS = 7;

class AuthService {
  constructor(
    private readonly userRepo: userRepository,
    private readonly logger: typeof Logger,
    private readonly authRepo: authRepository,
  ) {}

  private generateToken(user: IUser) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    return {
      accessToken,
      refreshToken,
    };
  }

  async createUser(userData: INewUser) {
    let userExist = await this.userRepo.checkRegistrationConflict(
      userData.username,
      userData.email,
    );

    if (userExist) {
      throw new AppError(
        "Registration failed. Please try a different email or username.",
        409,
      );
    }

    const { password, ...rest } = userData;

    if (!password) {
      throw new AppError("Password is required", 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.userRepo.create({
      ...rest,
      password: hashedPassword,
    });

    this.logger.info("new user created");

    if (!user) {
      throw new Error("Cannot generate tokens: User is undefined.");
    }

    const { accessToken, refreshToken } = this.generateToken(user);

    const hashTokens = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_LIFESPAN_DAYS);

    await this.authRepo.create({
      userId: user.id,
      tokenHash: hashTokens,
      expiresAt: expiresAt,
    });

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async login(user: IUser) {
    const { accessToken, refreshToken } = this.generateToken(user);

    const hashTokens = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_LIFESPAN_DAYS);

    await this.authRepo.create({
      userId: user.id,
      tokenHash: hashTokens,
      expiresAt: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}

export default AuthService;
