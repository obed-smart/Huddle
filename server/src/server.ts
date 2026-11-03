import "dotenv/config";
import { createServer } from "http";

import app from "./app";
import env from "./config/env";
import { testDatabaseConnection } from "./db";
import logger from "./shared/utils/logger";
import { createSocketServer } from "./sockets";
import { emailWorker } from "./modules/notification/email.worker";
import redisClient from "./config/redis.config";
import { registerRateLimiterBucket } from "./middlewares/rate.limiter";
import bullmqConnection from "./config/bullmq.connection";

const startServer = async () => {
  try {
    const server = createServer(app);

    logger.info("Initializing database connection...");
    await testDatabaseConnection();
    logger.info("Database connection established successfully.");

    logger.info("Verifying Redis connection...");
    await redisClient.ping();
    registerRateLimiterBucket(redisClient);
    logger.info("Rate limiter ready.");

    logger.info("Initializing WebSocket layers...");
    createSocketServer(server);

    server.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} on port ${env.PORT} 🚀`);
    });

    server.on("error", (err) => {
      logger.error({ err }, "Server crashed after starting");
      process.exit(1);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close();
      logger.info("closing email worker");
      await emailWorker.close();
      logger.info("email worker closed");
      await redisClient.quit();
      await bullmqConnection.quit();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error({ err }, "Server initialization failed");
    await emailWorker.close();
    await redisClient.quit();
    await bullmqConnection.quit();
    process.exit(1);
  }
};

startServer();
