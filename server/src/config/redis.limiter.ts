import Redis from "ioredis";
import logger from "../shared/utils/logger";
import env from "./env";

const limiterRedis = new Redis(
  env.NODE_ENV === "production" ? env.REDIS_PROD : env.REDIS_LOCAL,
  { enableOfflineQueue: false },
);

limiterRedis.on("connect", () => {
  logger.info("Connected to Limiter Redis successfully");
});

limiterRedis.on("error", (err: Error) =>
  logger.error({ error: err }, "Rate limiter Redis error"),
);

export default limiterRedis;
