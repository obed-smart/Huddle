import { IUser } from "../../db/schema/schema.user";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import AuthService from "./auth.services";
import { Response } from "express";

class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    expiedAt: Date,
  ) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, 
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Number(expiedAt), 
    });
  }

  register = catchAsync(async (req, res) => {
    const { user, refreshToken, accessToken, expiresAt } =
      await this.authService.createUser(req.body);

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
}

export default AuthController;
