import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { authMiddleware } from "./auth.socket";
import logger from "../shared/utils/logger";
import { registerEvents } from "./register-events";
import { setIoInstance } from "./socket.gateway";

export function createSocketServer(server: HttpServer) {
  logger.debug("SOCKET.IO");
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL!, "https://oauth.pstmn.io"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    const { sub: userId, username } = socket.data.user;

    logger.debug(`socket user ${socket.data.user}`);

    socket.join(`user:${userId}`);

    logger.debug(`user id: ${userId}`);

    logger.info(`🔌 @${username} connected (socket ${socket.id})`);

    // registerEvents(io, socket);

    socket.on("disconnect", () => {
      const { userId, username } = socket.data.user;

      logger.info(`${username} (${socket.id}) disconnected`);
    });
  });

  setIoInstance(io);

  return io;
}
