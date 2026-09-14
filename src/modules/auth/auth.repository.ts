import { and, eq, isNull } from "drizzle-orm";
import { db as DbiInstance } from "../../db";
import {
  INewRefreshToken,
  refreshTokensTable as refreshTokenInstance,
} from "../../db/schema/schema.refreshTokens";

class AuthRepository {
  constructor(
    private readonly db: typeof DbiInstance,
    private readonly refreshTokensTable: typeof refreshTokenInstance,
  ) {}

  async create(data: INewRefreshToken) {
    return await this.db.insert(this.refreshTokensTable).values(data);
  }

  async findByTokenHash(tokenHash: string) {
    return await this.db.query.refreshTokensTable.findFirst({
      where: eq(this.refreshTokensTable.tokenHash, tokenHash),
    });
  }

  async revokeById(id: string) {
    return await this.db
      .update(this.refreshTokensTable)
      .set({
        revokedAt: new Date(),
      })
      .where(
        and(
          eq(this.refreshTokensTable.id, id),
          isNull(this.refreshTokensTable.revokedAt),
        ),
      );
  }

  async revokeFamily(familyId: string) {
    return await this.db
      .update(this.refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(this.refreshTokensTable.familyId, familyId),
          isNull(this.refreshTokensTable.revokedAt),
        ),
      );
  }

  async revokeAllRefreshTokens(userId: string) {
    const result = await this.db
      .update(this.refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(this.refreshTokensTable.userId, userId),
          isNull(this.refreshTokensTable.revokedAt),
        ),
      );
    return result;
  }

  async revokeRefreshToken(tokenHash: string) {
    const result = await this.db
      .update(this.refreshTokensTable)
      .set({
        revokedAt: new Date(),
      })
      .where(
        and(
          eq(this.refreshTokensTable.tokenHash, tokenHash),
          isNull(this.refreshTokensTable.revokedAt),
        ),
      );

    return result;
  }
}

export default AuthRepository;
