import {
  INewUser,
  IUser,
  usersTable as user,
} from "../../db/schema/schema.user";
import { db as dbInstance } from "../../db";
import { eq, or } from "drizzle-orm";
import Logger from "../../shared/utils/logger";

type DbType = typeof dbInstance;

class UserRepository {
  constructor(
    private readonly db: DbType,
    private readonly logger: typeof Logger,
    private readonly usersTable: typeof user,
  ) {}

  async create(userData: INewUser) {
    const [newUser] = await this.db
      .insert(this.usersTable)
      .values(userData)
      .returning();

    return newUser;
  }

  async findByEmail(email: IUser["email"]): Promise<IUser | null> {
    const user = await this.db.query.usersTable.findFirst({
      where: eq(this.usersTable.email, email),
    });

    return user ?? null;
  }

  async findUserById(id: IUser["id"]): Promise<IUser | null> {
    const user = await this.db.query.usersTable.findFirst({
      where: eq(this.usersTable.id, id),
    });

    return user ?? null;
  }

  async findUserByGoogleId(id: IUser["googleId"]): Promise<IUser | null> {
    if (!id) return null;

    const user = await this.db.query.usersTable.findFirst({
      where: eq(this.usersTable.googleId, id),
    });

    return user ?? null;
  }

  /**
   * Finds a user by matching EITHER their username OR their email.
   * @param identifier The string containing the username or email input
   * @returns IUser
   */
  async findUserByUsernameOrEmail(identifier: string): Promise<IUser | null> {
    try {
      if (!identifier) return null;

      const user = await this.db.query.usersTable.findFirst({
        where: or(
          eq(this.usersTable.username, identifier),
          eq(this.usersTable.email, identifier),
        ),
      });

      return (user as IUser) ?? null;
    } catch (error) {
      this.logger.error(
        `Error finding user by identifier (${identifier}): ${error}`,
      );
      throw error;
    }
  }

  /**
   *
   * @param username
   * @param email
   * @returns
   */
  async checkRegistrationConflict(
    username: string,
    email: string,
  ): Promise<IUser | null> {
    const existingUser = await this.db.query.usersTable.findFirst({
      where: or(
        eq(this.usersTable.username, username),
        eq(this.usersTable.email, email),
      ),
    });

    return existingUser ?? null;
  }
}

export default UserRepository;
