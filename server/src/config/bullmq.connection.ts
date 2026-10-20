import { Redis } from "ioredis";

import dotenv from "dotenv";
import logger from "../shared/utils/logger";
import env from "./env";

dotenv.config();

export const bullmqConnection =
  process.env.NODE_ENV === "production"
    ? new Redis(env.REDIS_PROD, {
        maxRetriesPerRequest: null,
      })
    : new Redis(env.REDIS_LOCAL, {
      maxRetriesPerRequest: null,
    });

bullmqConnection.on("connect", () => {
  logger.info("BullMQ Redis connected");
});

bullmqConnection.on("error", (err: Error) => {
  logger.error({
    error: err.message,
  });
});

export default bullmqConnection;
