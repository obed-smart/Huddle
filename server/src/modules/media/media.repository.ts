import { db as dbInstance } from "../../db";

class MediaRepository {
  constructor(private readonly db: typeof dbInstance) {}
}

export default MediaRepository;
