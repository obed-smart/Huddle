import { Redis } from "ioredis";
import dotenv from "dotenv";
import logger from "../shared/utils/logger";
import env from "./env";

dotenv.config();

// const redis = new Redis(
//   process.env.NODE_ENV === 'production'
//     ? process.env.REDIS_URL
//     : {
//         host: process.env.REDIS_HOST,
//         port: Number(process.env.REDIS_PORT),
//         password: process.env.REDIS_PASSWORD,
//       },
// );

const redisClient =
  process.env.NODE_ENV === "production"
    ? new Redis(env.REDIS_PROD, {
        maxRetriesPerRequest: null,
      })
    : new Redis(env.REDIS_LOCAL);

redisClient.on("connect", () => {
  logger.info("Connected to Redis successfully");
});

redisClient.on("error", (err: Error) => {
  logger.error({ error: err }, "Redis connection error");
});

export default redisClient;
