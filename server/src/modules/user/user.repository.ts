import {
  INewUser,
  IUser,
  usersTable as user,
} from "../../db/schema/schema.user";
import { db as dbInstance } from "../../db";
import { and, eq, gt, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import Logger from "../../shared/utils/logger";
import { AuthUser, PublicUser } from "../../shared/types";
import AppError from "../../shared/utils/apiError";
import { from } from "node:stream/iter";
import { UpdateUserDto } from "./user.validation";
import { dbErrorConstraint, fail } from "../../shared/utils/utits";

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

  async create(userData: INewUser): Promise<AuthUser | undefined> {
    try {
      const [user] = await this.db
        .insert(this.usersTable)
        .values(userData)
        .onConflictDoNothing()
        .returning(authUserSelection);

      return user;
    } catch (error) {
      const dbError = dbErrorConstraint(error);

      if (dbError?.code === "23505") {
        if (dbError.constraint === "users_username_unique") {
          throw new AppError("Username is already taken", 409);
        }

        throw new AppError(
          "Registration failed. Please try a different email or username.",
          409,
        );
      }

      fail(error, "Failed to create user", {
        username: userData.username,
      });
    }
  }

  async replaceUnverifiedUser(userData: INewUser): Promise<AuthUser> {
    try {
      return this.db.transaction(async (tx) => {
        await tx
          .delete(this.usersTable)
          .where(
            and(
              eq(this.usersTable.email, userData.email),
              eq(this.usersTable.isEmailVerified, false),
            ),
          );

        const [user] = await tx
          .insert(this.usersTable)
          .values(userData)
          .returning(authUserSelection);

        if (!user) throw new Error("Failed to create user");

        return user;
      });
    } catch (error) {
      fail(error, "Failed creating user ");
    }
  }

  async getEmailVerified(email: string): Promise<{
    id: string;
    email: string;
    username: string;
    isEmailVerified: boolean;
  } | null> {
    try {
      const [row] = await this.db
        .select({
          id: this.usersTable.id,
          email: user.email,
          username: user.username,
          isEmailVerified: this.usersTable.isEmailVerified,
        })
        .from(this.usersTable)
        .where(eq(this.usersTable.email, email))
        .limit(1);

      return row ?? null;
    } catch (error) {
      fail(error, "Fialed on checking user verification");
    }
  }

  async findByEmail(email: IUser["email"]) {
    try {
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
          passwordResetAttempts: true,
          passwordResetOtp: true,
          passwordResetOtpExpiry: true,
        },
      });

      return user ?? null;
    } catch (error) {
      fail(error, "Failed to find user by email", { email });
    }
  }

  async findAuthUserById(id: string): Promise<AuthUser | null> {
    try {
      const [user] = await this.db
        .select(authUserSelection)
        .from(this.usersTable)
        .where(eq(this.usersTable.id, id));

      return user ?? null;
    } catch (error) {
      fail(error, "Failed to find user by id", { userId: id });
    }
  }

  async userNameExists(username: string): Promise<boolean> {
    try {
      const result = await this.db.execute(
        sql`SELECT EXISTS (SELECT 1 FROM ${this.usersTable} WHERE username = ${username}) AS "exists"`,
      );

      return result.rows[0]?.exists as boolean;
    } catch (error) {
      fail(error, "Failed to check if username exists", { username });
    }
  }

  async findUserForLogin(identifier: string) {
    try {
      const [user] = await this.db
        .select({
          id: this.usersTable.id,
          username: this.usersTable.username,
          email: this.usersTable.email,
          password: this.usersTable.password,
          globalRole: this.usersTable.globalRole,
          isEmailVerified: this.usersTable.isEmailVerified,
        })
        .from(this.usersTable)
        .where(
          or(
            eq(this.usersTable.email, identifier),
            eq(this.usersTable.username, identifier),
          ),
        );

      return user ?? null;
    } catch (error) {
      fail(error, "Failed to find user for login", { identifier });
    }
  }

  async findUserById(id: IUser["id"]): Promise<IUser | null> {
    try {
      const user = await this.db.query.usersTable.findFirst({
        where: eq(this.usersTable.id, id),
      });

      return user ?? null;
    } catch (error) {
      fail(error, "Failed to find user by id", { userId: id });
    }
  }

  async findAuthUserByGoogleId(googleId: string): Promise<AuthUser | null> {
    try {
      const [user] = await this.db
        .select(authUserSelection)
        .from(this.usersTable)
        .where(eq(this.usersTable.googleId, googleId));

      return user ?? null;
    } catch (error) {
      fail(error, "Failed to find user by Google account", { googleId });
    }
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
      fail(error, "Failed to find user by username", { username });
    }
  }

  /**
   * Checks whether a username or email is already taken.
   * @param username
   * @param email
   * @returns The conflicting user row, or undefined if there is no conflict.
   */
  async checkRegistrationConflict(username: string, email: string) {
    try {
      return await this.db.query.usersTable.findFirst({
        where: or(
          eq(this.usersTable.username, username),
          eq(this.usersTable.email, email),
        ),
      });
    } catch (error) {
      fail(error, "Failed to check registration conflict", {
        username,
        email,
      });
    }
  }

  async searchUsers(
    query: string,
    currentUserId: IUser["id"],
    limit = 10,
  ): Promise<PublicUser[]> {
    try {
      if (!query.trim()) return [];

      return await this.db
        .select(publicUserSelection)
        .from(this.usersTable)
        .where(
          and(
            ilike(this.usersTable.username, `%${query}%`),
            ne(this.usersTable.id, currentUserId),
          ),
        )
        .limit(limit);
    } catch (error) {
      fail(error, "Failed to search users", {
        query,
        currentUserId,
        limit,
      });
    }
  }

  async filterValidInviteUser(invitedUsers: string[]) {
    try {
      return await this.db
        .select({ userId: this.usersTable.id })
        .from(this.usersTable)
        .where(inArray(this.usersTable.id, invitedUsers));
    } catch (error) {
      fail(error, "Failed to validate invited users", {
        invitedCount: invitedUsers.length,
      });
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
      fail(error, "Failed to update user profile", {
        userId,
        fields: Object.keys(updateData),
      });
    }
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<AuthUser> {
    try {
      const [user] = await this.db
        .update(this.usersTable)
        .set({ googleId })
        .where(
          and(eq(this.usersTable.id, userId), isNull(this.usersTable.googleId)),
        )
        .returning(authUserSelection);

      if (!user) throw new AppError("Account is already linked to Google", 409);

      return user;
    } catch (error) {
      fail(error, "Failed merging account");
    }
  }

  async startEmailVerification(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    try {
      await this.db
        .update(this.usersTable)
        .set({
          emailVerificationToken: tokenHash,
          emailVerificationTokenExpiry: expiresAt,
        })
        .where(
          and(
            eq(this.usersTable.id, userId),
            eq(this.usersTable.isEmailVerified, false),
          ),
        );
    } catch (error) {
      fail(error, "Failed verifyiny email");
    }
  }

  async clearEmailVerification(userId: string) {
    try {
      await this.db
        .update(this.usersTable)
        .set({
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        })
        .where(eq(this.usersTable.id, userId));
    } catch (error) {
      fail(error, "");
    }
  }

  async completeEmailVerification(
    token: string,
  ): Promise<AuthUser | undefined> {
    try {
      const [user] = await this.db
        .update(this.usersTable)
        .set({
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
          isEmailVerified: true,
        })
        .where(
          and(
            eq(this.usersTable.emailVerificationToken, token),
            gt(this.usersTable.emailVerificationTokenExpiry, new Date()),
            eq(this.usersTable.isEmailVerified, false),
          ),
        )
        .returning(authUserSelection);

      return user;
    } catch (error) {
      fail(error, "");
    }
  }

  async startPasswordReset(userId: string, otpHash: string, expiresAt: Date) {
    try {
      await this.db
        .update(this.usersTable)
        .set({
          passwordResetOtp: otpHash,
          passwordResetOtpExpiry: expiresAt,
          passwordResetAttempts: 0,
        })
        .where(eq(this.usersTable.id, userId));
    } catch (error) {
      fail(error, "failed on forgetten password", {
        userId,
      });
    }
  }

  async incrementResetAttempts(userId: string) {
    try {
      await this.db
        .update(this.usersTable)
        .set({
          passwordResetAttempts: sql`${this.usersTable.passwordResetAttempts} + 1`,
        })
        .where(eq(this.usersTable.id, userId));
    } catch (error) {
      fail(error, "Failed to update password attempts");
    }
  }

  async clearPasswordReset(userId: string) {
    try {
      await this.db
        .update(this.usersTable)
        .set({
          passwordResetOtp: null,
          passwordResetOtpExpiry: null,
          passwordResetAttempts: null,
        })
        .where(eq(this.usersTable.id, userId));
    } catch (error) {
      fail(error, "Failed to clear password reset", { userId });
    }
  }

  async completePasswordReset(userId: string, passwordHash: string) {
    try {
      await this.db
        .update(this.usersTable)
        .set({
          password: passwordHash,
          passwordResetOtp: null,
          passwordResetOtpExpiry: null,
          passwordResetAttempts: null,
        })
        .where(eq(this.usersTable.id, userId));
    } catch (error) {
      fail(error, "failed resetting password");
    }
  }
}

export default UserRepository;
