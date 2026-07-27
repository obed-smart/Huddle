import { db as DbiInstance } from "../../db";
import { INewConversation } from "../../db/schema";

class RoomRepository {
  constructor(private readonly db: typeof DbiInstance) {}

  async createRoom(data: INewConversation) {
    
  }
}

export default RoomRepository;
