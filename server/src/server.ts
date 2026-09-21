import "dotenv/config";
import { createServer } from "http";

import app from "./app";
import env from "./config/env";
import { testDatabaseConnection } from "./db";
import logger from "./shared/utils/logger";
import { createSocketServer } from "./sockets";

const startServer = async () => {
  try {
    const server = createServer(app);

    logger.info("Initializing database connection...");

    await testDatabaseConnection();

    logger.info("Database connection established successfully.");

    logger.info("Initializing WebSocket layers...");
    createSocketServer(server);

    server.listen(env.PORT, () => {
      logger.info(
        `Server is running on ${env.NODE_ENV} at port ${env.PORT} 🚀`,
      );
    });

    server.on("error", (err) => {
      console.error("💥 Server crashed after starting:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("💥 Server initialization failed:", err);
    process.exit(1);
  }
};

startServer();
