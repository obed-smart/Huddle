import {
  INewUser,
  IUser,
  usersTable as user,
} from "../../db/schema/schema.user";
import { db as dbInstance } from "../../db";
import { and, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import Logger from "../../shared/utils/logger";
import { AuthUser, PublicUser } from "../../shared/types";
import AppError from "../../shared/utils/apiError";
import { from } from "node:stream/iter";
import { UpdateUserDto } from "./user.validation";

type DbType = typeof dbInstance;

export const authUserSelection = {
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  globalRole: user.globalRole,
  isEmailVerified: user.isEmailVerified,
  bio: user.bio,
};

export const publicUserSelection = {
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
};

class UserRepository {
  constructor(
    private readonly db: DbType,
    private readonly logger: typeof Logger,
    private readonly usersTable: typeof user,
  ) {}

  async create(userData: INewUser): Promise<AuthUser> {
    const [user] = await this.db
      .insert(this.usersTable)
      .values(userData)
      .returning(authUserSelection);

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  async findByEmail(email: IUser["email"]): Promise<AuthUser | null> {
    const user = await this.db.query.usersTable.findFirst({
      where: eq(this.usersTable.email, email),
      columns: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        globalRole: true,
        isEmailVerified: true,
      },
    });

    return user ?? null;
  }

  async findAuthUserById(id: string): Promise<AuthUser | null> {
    const [user] = await this.db
      .select(authUserSelection)
      .from(this.usersTable)
      .where(eq(this.usersTable.id, id));

    return user ?? null;
  }

  async userNameExists(username: string): Promise<boolean> {
    const result = await this.db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM ${this.usersTable} WHERE username = ${username}) AS "exists"`,
    );

    return result.rows[0]?.exists as boolean;
  }

  async findUserForLogin(identifier: string) {
    const [user] = await this.db
      .select({
        id: this.usersTable.id,
        username: this.usersTable.username,
        email: this.usersTable.email,
        password: this.usersTable.password,
        globalRole: this.usersTable.globalRole,
      })
      .from(this.usersTable)
      .where(
        or(
          eq(this.usersTable.email, identifier),
          eq(this.usersTable.username, identifier),
        ),
      );

    return user ?? null;
  }

  async findUserById(id: IUser["id"]): Promise<IUser | null> {
    const user = await this.db.query.usersTable.findFirst({
      where: eq(this.usersTable.id, id),
    });

    return user ?? null;
  }

  async findAuthUserByGoogleId(googleId: string): Promise<AuthUser | null> {
    const [user] = await this.db
      .select(authUserSelection)
      .from(this.usersTable)
      .where(eq(this.usersTable.googleId, googleId));

    return user ?? null;
  }

  /**
   * Finds a user by their username.
   * @param username The string containing the username input
   * @returns A user object if found, otherwise null.
   */
  async findUserByUsername(
    username: IUser["username"],
  ): Promise<PublicUser | null> {
    try {
      if (!username) return null;

      const [user] = await this.db
        .select(publicUserSelection)
        .from(this.usersTable)
        .where(eq(this.usersTable.username, username.trim()));

      return user ?? null;
    } catch (error) {
      this.logger.error(
        `Error finding user by identifier (${username}): ${error}`,
      );
      throw new AppError(
        "An error occurred while trying to find the user by username.",
        500,
      );
    }
  }

  /**
   *
   * @param username
   * @param email
   * @returns
   */

  async checkRegistrationConflict(username: string, email: string) {
    try {
      return await this.db.query.usersTable.findFirst({
        where: or(
          eq(this.usersTable.username, username),
          eq(this.usersTable.email, email),
        ),
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async searchUsers(
    query: string,
    currentUserId: IUser["id"],
    limit = 10,
  ): Promise<PublicUser[]> {
    try {
      if (!query.trim()) return [];

      const users = await this.db
        .select(publicUserSelection)
        .from(this.usersTable)
        .where(
          and(
            ilike(this.usersTable.username, `%${query}%`),
            ne(this.usersTable.id, currentUserId),
          ),
        )
        .limit(limit);
      return users;
    } catch (error) {
      this.logger.error(`Error searching users (${query}): ${error}`);
      throw new AppError("An error occurred while searching for users.", 500);
    }
  }

  async filterValidInviteUser(invitedUsers: string[]) {
    try {
      return await this.db
        .select({ userId: this.usersTable.id })
        .from(this.usersTable)
        .where(inArray(this.usersTable.id, invitedUsers));
    } catch (error) {
      this.logger.error({ error }, "Failed fetching valid invite user");
      throw new AppError("Failed fetching valid invite user", 500);
    }
  }

  async updateUserProfile(
    userId: string,
    updateData: Partial<UpdateUserDto>,
  ): Promise<PublicUser | null> {
    try {
      const [updatedUser] = await this.db
        .update(this.usersTable)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(this.usersTable.id, userId))
        .returning(publicUserSelection);

      return updatedUser ?? null;
    } catch (error) {
      this.logger.error(
        { error },
        `Failed to update user profile for userId: ${userId}`,
      );
      throw new AppError("Failed to update user profile", 500);
    }
  }

  async linkGoogleAccount(userId: string, googleId: string) {
    return await this.db
      .update(this.usersTable)
      .set({
        googleId: googleId,
      })
      .where(eq(this.usersTable.id, userId));
  }
}

export default UserRepository;
