import { and, eq, gt, isNull } from "drizzle-orm";
import { db as DbiInstance } from "../../db";
import {
  INewRefreshToken,
  refreshTokensTable as refreshTokenInstance,
  sessionsTable,
} from "../../db/schema/schema.session";
import AppError from "../../shared/utils/apiError";
import ro from "zod/v4/locales/ro.js";
import logger from "../../shared/utils/logger";
import { usersTable } from "../../db/schema";

class AuthRepository {
  constructor(
    private readonly db: typeof DbiInstance,
    private readonly session: typeof sessionsTable,
    private readonly refreshTokensTable: typeof refreshTokenInstance,
    private readonly user: typeof usersTable,
  ) {}

  async createSession(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    try {
      return this.db.transaction(async (tx) => {
        const [session] = await tx
          .insert(this.session)
          .values({
            userId: data.userId,
          })
          .returning({ id: this.session.id });

        if (!session) {
          throw new AppError("Failed loging in", 500);
        }

        await tx.insert(this.refreshTokensTable).values({
          sessionId: session.id,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
        });

        return session;
      });
    } catch (error: any) {
      logger.error({ err: error }, "Login transaction failed");
      throw error;
    }
  }

  async isActive(sessionId: string): Promise<boolean> {
    const [session] = await this.db
      .select({ id: this.session.id })
      .from(this.session)
      .where(
        and(eq(this.session.id, sessionId), isNull(this.session.revokedAt)),
      )
      .limit(1);

    return !!session;
  }

  async revokeSession(sessionId: string) {
    return await this.db
      .update(this.session)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(this.session.id, sessionId), isNull(this.session.revokedAt)),
      );
  }

  async revokeAllSession(userId: string) {
    return await this.db
      .update(this.session)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(this.session.userId, userId), isNull(this.session.revokedAt)),
      );
  }

  async refresh(data: {
    newTokenHash: string;
    oldTokenHash: string;
    expiresAt: Date;
  }) {
    try {
      return this.db.transaction(async (tx) => {
        const [row] = await tx
          .select({
            refreshId: this.refreshTokensTable.id,
            usedAt: this.refreshTokensTable.usedAt,
            sessionId: this.session.id,
            userId: this.session.userId,
            username: this.user.username,
            role: this.user.globalRole,
          })
          .from(this.refreshTokensTable)
          .innerJoin(
            this.session,
            eq(this.session.id, this.refreshTokensTable.sessionId),
          )
          .innerJoin(this.user, eq(this.user.id, this.session.userId))
          .where(
            and(
              eq(this.refreshTokensTable.tokenHash, data.oldTokenHash),
              gt(this.refreshTokensTable.expiresAt, new Date()),
              isNull(this.session.revokedAt),
            ),
          )
          .for("update", { of: this.refreshTokensTable })
          .limit(1);

        if (!row)
          throw new AppError("Invalid session, please login again", 401);

        if (row.usedAt)
          return {
            kind: "reused" as const,
            userId: row.userId,
            sessionId: row.sessionId,
            username: row.username,
            role: row.role,
          };

        await tx
          .update(this.refreshTokensTable)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(this.refreshTokensTable.id, row.refreshId),
              isNull(this.refreshTokensTable.usedAt),
            ),
          );

        await tx.insert(this.refreshTokensTable).values({
          tokenHash: data.newTokenHash,
          sessionId: row.sessionId,
          expiresAt: data.expiresAt,
        });

        return {
          kind: "rotated" as const,
          userId: row.userId,
          sessionId: row.sessionId,
          username: row.username,
          role: row.role,
        };
      });
    } catch (error) {
      logger.error(error, "Failed on access refresh");
      throw new AppError("Failed on refresh", 500);
    }
  }
}

export default AuthRepository;
