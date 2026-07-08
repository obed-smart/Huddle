import UserRepository from "./user.repository";
import Logger from "../../shared/utils/logger";
import { INewUser } from "../../db/schema/schema.user";
import AppError from "../../shared/utils/apiError";
import { hashPassword } from "../../shared/utils/utits";

class UserService {
  constructor(
    private userRepo: UserRepository,
    private logger: typeof Logger,
  ) {}

  async createUser(userData: INewUser) {
    const exists = await this.userRepo.checkRegistrationConflict(
      userData.username,
      userData.email,
    );

    if (exists) {
      throw new AppError(
        "Registration failed. Please try a different email or username.",
        409,
      );
    }

    const { password, googleId, provider, ...rest } = userData;

    if (provider === "local" && !password) {
      throw new AppError("Password is required", 400);
    }

    const hashedPassword = password ? await hashPassword(password) : null;

    const user = await this.userRepo.create({
      ...rest,
      provider,
      password: hashedPassword,
      googleId,
    });

    this.logger.info("New user created");

    return user;
  }

  async findUserByUsername(username: string) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async findAuthUserById(id: string) {
    const user = await this.userRepo.findAuthUserById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async findUserForLogin(identifier: string) {
    const user = await this.userRepo.findUserForLogin(identifier);
    if (!user) throw new AppError("User not found", 404);

    return user;
  }

  async findAuthUserByGoogleId(googleId: string) {
    const user = await this.userRepo.findAuthUserByGoogleId(googleId);

    return user;
  }

  async checkRegistrationConflict(username: string, email: string) {
    const user = await this.userRepo.checkRegistrationConflict(username, email);

    if (user) {
      throw new AppError(
        "Registration failed. Please try a different email or username.",
        409,
      );
    }
  }

  /**
   * @param username - The username to check for existence.
   * @returns A boolean indicating whether the username exists.
   */
  async userNameExists(username: string): Promise<boolean> {
    return await this.userRepo.userNameExists(username);
  }

  async searchUsers(query: string, currentUserId: string) {
    const users = await this.userRepo.searchUsers(query, currentUserId);
    return users;
  }
}
export default UserService;
