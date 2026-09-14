import { Request, Response } from "express";

import { IUser } from "../../db/schema/schema.user";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import AuthService from "./auth.services";
import authServices from "./auth.services";
import AppError from "../../shared/utils/apiError";
import { AuthUser } from "../../shared/types";
import env from "../../config/env";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
};
class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ) {
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge:
        env.NODE_ENV === "production"
          ? 15 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      expires: expiresAt,
    });
  }

  register = catchAsync(async (req, res) => {
    const displayName = `${req.body.firstName} ${req.body.lastName}`.trim();
    const { user, refreshToken, accessToken, expiresAt } =
      await this.authService.register({ ...req.body, displayName });

    this.setCookies(res, accessToken, refreshToken, expiresAt);

    res.status(201).json(
      ApiResponse.success({
        id: user.id,
        email: user.email,
        username: user.username,
        avataUrl: user.avatarUrl,
      }),
    );
  });

  login = catchAsync(async (req, res) => {
    const user = req.user as IUser;

    const { accessToken, refreshToken, expiresAt } =
      await this.authService.login(user);

    this.setCookies(res, accessToken, refreshToken, expiresAt);

    res.status(201).json(
      ApiResponse.success({
        id: user.id,
        email: user.email,
        username: user.username,
        avataUrl: user.avatarUrl,
      }),
    );
  });

  logout = catchAsync(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token not found", 400);
    }

    await this.authService.logout(refreshToken);

    res.clearCookie("accessToken", cookieOptions);

    res.clearCookie("refreshToken", cookieOptions);

    res.status(204).json(ApiResponse.success(null));
  });

  googleCallback = catchAsync(async (req: Request, res: Response) => {
    const authResult = req.user as
      | { user: AuthUser; isNewUser: boolean }
      | undefined;

    if (!authResult?.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { accessToken, refreshToken, expiresAt } =
      await this.authService.googleCallback(authResult.user);

    this.setCookies(res, accessToken, refreshToken, expiresAt);

    res.redirect(`${process.env.FRONTEND_URL!}/chat`);
  });

  refresh = catchAsync(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new AppError("Refresh token not found", 400);

    try {
      const {
        accessToken,
        refreshToken: newToken,
        expiresAt,
      } = await this.authService.refresh(refreshToken);

      this.setCookies(res, accessToken, newToken, expiresAt);
      res.status(200).json(ApiResponse.success(null));
    } catch (error) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      throw error;
    }
  });

  
}

export default AuthController;
