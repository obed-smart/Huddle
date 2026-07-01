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
  
}

export default AuthRepository;
