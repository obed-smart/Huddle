import { randomInt } from "node:crypto";
import Logger from "../../shared/utils/logger";
import { INewUser, IUser } from "../../db/schema/schema.user";
import AppError from "../../shared/utils/apiError";

import authRepository from "./auth.repository";
import {
  fail,
  generateAccessToken,
  generateRefreshToken,
  generateUniqueUsername,
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
  addAccountExistsJob,
  addPasswordChangedEmail,
  addPasswordResetEmail,
  addVerifyEmailJob,
  addWellcomeEmail,
} from "../notification/email.queue";
import { Profile } from "passport-google-oauth20";
import redisClient from "../../config/redis.config";

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
    const status = await this.userService.getEmailVerified(userData.email);

    this.logger.debug({ verify: !status?.isEmailVerified }, "new user status");

    if (status === null) {
      const user = await this.userService.createUser({
        ...userData,
        provider: "local",
      });
      const token = await this.generateEmailverificationToken(user.id);
      const verifyUrl = this.buildVerifyEmailUrl(token);

      await addVerifyEmailJob(
        user.email,
        user.displayName ?? user.username,
        verifyUrl,
        token,
      );
      this.logger.info("user registered successfully");
    } else if (!status.isEmailVerified) {
      this.logger.debug("Email not verify");

      const allowed = await redisClient.set(
        `rl:user:unverified:${status.email.toLowerCase()}`,
        "1",
        "EX",
        180,
        "NX",
      );

      if (!allowed) return;

      const user = await this.userService.replaceUnverifiedUser({
        ...userData,
        provider: "local",
      });

      const token = await this.generateEmailverificationToken(user.id);
      const verifyUrl = this.buildVerifyEmailUrl(token);

      await addVerifyEmailJob(
        user.email,
        user.displayName ?? user.username,
        verifyUrl,
        token,
      );
      this.logger.info("New user registered successfully");
    } else {
      const allowed = await redisClient.set(
        `rl:user:exists:${status.id}`,
        "1",
        "EX",
        180,
        "NX",
      );

      if (!allowed) return;

      const loginUrl = `${env.FRONTEND_URL}`;

      await addAccountExistsJob(status.email, status.username, loginUrl);
    }
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

  async googleLogin(
    profile: Profile,
  ): Promise<{ user: AuthUser; isNewUser: boolean }> {
    const email = profile.emails?.[0]?.value?.toLowerCase().trim();
    const emailVerified =
      profile.emails?.[0]?.verified ?? profile._json?.email_verified ?? false;

    if (!email) throw new AppError("No email returned from Google", 400);
    if (!emailVerified) throw new AppError("Google email is not verified", 403);

    const linked = await this.userService.findAuthUserByGoogleId(profile.id);
    if (linked) return { user: linked, isNewUser: false };

    const existing = await this.userService.getEmailVerified(email);

    if (existing?.isEmailVerified) {
      const user = await this.userService.linkGoogleAccount(
        existing.id,
        profile.id,
      );

      return { user, isNewUser: false };
    }

    const username = await generateUniqueUsername(profile.displayName);

    const user = await this.userService.replaceUnverifiedUser({
      email,
      username,
      displayName: profile.displayName || username,
      googleId: profile.id,
      provider: "google",
      isEmailVerified: true,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
    this.logger.info("user registered successfully");

    return { user, isNewUser: true };
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
      await this.logOutAll(refresh.userId);
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

    const allowed = await redisClient.set(
      `rl:forget${user.id}`,
      "1",
      "EX",
      300,
      "NX",
    );
    if (!allowed) return;

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
    const locked = (user.passwordResetAttempts ?? 0) >= MAX_ATTEMPTS;

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

  private buildVerifyEmailUrl(token: string): string {
    const base = env.FRONTEND_URL.replace(/\+$/, "")
    return `${base}/#/verify-email?token=${encodeURIComponent(token)}`
  }

  private async generateEmailverificationToken(userId: string) {
    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const tts = env.EMAIL_VERIFICATION_LIFESPAN * 60 * 60 * 1000;
    const expiredAt = new Date(Date.now() + tts);

    await this.userService.startEmailVerification(userId, tokenHash, expiredAt);

    return token;
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);

    const user = await this.userService.completeEmailVerification(tokenHash);

    if (!user) {
      throw new AppError("This link is invalid or has expired", 400);
    }

    await addWellcomeEmail(user);

    this.logger.info(`User ${user.id} verified their email`);
  }

  async resendVerificationEmail(email: string) {
    try {
      const existing = await this.userService.getEmailVerified(email);

      if (!existing) return;

      if (existing.isEmailVerified) {
        return;
      }

      const allowed = await redisClient.set(
        `rl:resend:${existing.id}`,
        "1",
        "EX",
        60,
        "NX",
      );
      if (!allowed) return;

      const token = await this.generateEmailverificationToken(existing.id);
      const verifyUrl = this.buildVerifyEmailUrl(token);

      await addVerifyEmailJob(
        existing.email,
        existing.username,
        verifyUrl,
        token,
      );
    } catch (error) {
      fail(error, "resend verification failed");
    }
  }
}

export default AuthService;
