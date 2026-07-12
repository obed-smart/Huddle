import { IUser } from "../../db/schema/schema.user";
import { PublicUser } from "../../shared/types";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import logger from "../../shared/utils/logger";
import UserService from "./user.services";

class UserController {
  constructor(private readonly userService: UserService) {}

  getMe = catchAsync(async (req, res) => {
    res.status(200).json(ApiResponse.success(req.user));
  });

  getUserByUsername = catchAsync(async (req, res) => {
    const { username } = req.params;

    const user: PublicUser | null = await this.userService.findUserByUsername(
      username as string,
    );

    res.status(200).json(ApiResponse.success(user));
  });

  searchUsers = catchAsync(async (req, res) => {
    const { username } = req.query;
    const currentUserId = req.user?.id;

    const users = await this.userService.searchUsers(
      String(username ?? ""),
      currentUserId!,
    );

    logger.debug({ users }, "return users");

    res.status(200).json(ApiResponse.success(users));
  });
}

export default UserController;
