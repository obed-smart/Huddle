import { randomInt } from "node:crypto";
import Logger from "../../shared/utils/logger";
import { INewUser, IUser } from "../../db/schema/schema.user";
import AppError from "../../shared/utils/apiError";

import authRepository from "./auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  hashOtp,
  hashPassword,
  hashToken,
  verifyOtp,
} from "../../shared/utils/utits";
import UserService from "../user/user.services";

import { AuthUser } from "../../shared/types";
import env from "../../config/env";
import {
  disConnectSession,
  disConnectUser,
} from "../../sockets/socket.gateway";
import {
  addPasswordChangedEmail,
  addPasswordResetEmail,
  addWellcomeEmail,
} from "../notification/email.queue";

class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: typeof Logger,
    private readonly authRepo: authRepository,
  ) {}

  // private generateToken(user: AuthUser & { sessionId: string }) {

  //   return {
  //     accessToken,
  //     refreshToken,
  //   };
  // }

  private addDays() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_LIFESPAN_DAYS);

    return expiresAt;
  }

  private async storeSessionToken(user: AuthUser) {
    let expiresAt = this.addDays();
    const refreshToken = generateRefreshToken();

    const hashTokens = hashToken(refreshToken);

    const session = await this.authRepo.createSession({
      userId: user.id,
      tokenHash: hashTokens,
      expiresAt: expiresAt,
    });

    if (!session) {
      throw new AppError("Failed loging in", 500);
    }

    const accessToken = generateAccessToken({ ...user, sessionId: session.id });

    return { refreshToken, accessToken, expiresAt };
  }

  async register(userData: INewUser) {
    const user = await this.userService.createUser({
      ...userData,
      provider: "local",
    });

    const { refreshToken, accessToken, expiresAt } =
      await this.storeSessionToken(user);

    await addWellcomeEmail(user);
    this.logger.debug("Email sent");

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async login(user: AuthUser) {
    const { refreshToken, accessToken, expiresAt } =
      await this.storeSessionToken(user);

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async isActive(sessionId: string): Promise<boolean> {
    return await this.authRepo.isActive(sessionId);
  }
  async logout(sessionId: string) {
    await this.authRepo.revokeSession(sessionId);
    // end call if one exist here
    disConnectSession(sessionId);
    this.logger.debug("logout successfully");
  }

  async logOutAll(userId: string) {
    await this.authRepo.revokeAllSession(userId);

    disConnectUser(userId);

    this.logger.info("logout successfully");
  }

  async googleCallback(user: AuthUser, isNewUser: boolean) {
    const { refreshToken, accessToken, expiresAt } =
      await this.storeSessionToken(user);

    this.logger.info(`User ${user.id} logged in with Google`);

    if (isNewUser) {
      await addWellcomeEmail(user);
      this.logger.debug("Email sent");
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async refresh(token: string) {
    const oldTokenHash = hashToken(token);
    let expiresAt = this.addDays();

    const refreshToken = generateRefreshToken();

    const newTokenHash = hashToken(refreshToken);

    const refresh = await this.authRepo.refresh({
      newTokenHash,
      oldTokenHash,
      expiresAt,
    });

    const accessToken = generateAccessToken({
      id: refresh.userId,
      username: refresh.username,
      globalRole: refresh.role,
      sessionId: refresh.sessionId,
    });

    if (refresh.kind === "reused") {
      await this.logout(refresh.sessionId);
      this.logger.warn("Token reuse detected");
      throw new AppError("Token reuse detected", 401);
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async forgetPassword(email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) return null;

    const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");

    this.logger.debug({ otp }, "sent otp");

    const hashed = hashOtp(otp);

    const expiredAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.userService.startPasswordReset(user.id, hashed, expiredAt);

    await addPasswordResetEmail(email, otp);
  }

  async resetPassword(email: string, otp: string, password: string) {
    const MAX_ATTEMPTS = 5;
    const invalid = () => new AppError("Invalid or expired code", 400);

    const user = await this.userService.findUserByEmail(email);

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiry) {
      throw invalid();
    }

    const expired = user.passwordResetOtpExpiry < new Date();
    const locked = user.passwordResetAttempts ?? 0 >= MAX_ATTEMPTS;

    if (expired || locked) {
      await this.userService.clearPasswordReset(user.id);
      throw invalid();
    }

    const validOtp = verifyOtp(otp, user.passwordResetOtp);

    if (!validOtp) {
      await this.userService.incrementResetAttempts(user.id);
      throw invalid();
    }

    const hashed = await hashPassword(password);
    await this.userService.completePasswordReset(user.id, hashed);
    await this.logOutAll(user.id);

    await addPasswordChangedEmail(email, new Date());
    this.logger.info({ userId: user.id }, "Password reset completed");
  }
}

export default AuthService;
