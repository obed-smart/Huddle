import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { authMiddleware } from "./auth.socket";
import logger from "../shared/utils/logger";
import { registerEvents } from "./register-events";
import { setIoInstance } from "./socket.gateway";
import { onlineUsers } from "../shared/utils/utits";

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
    try {
      const { sub: userId, username } = socket.data.user;

      logger.debug(
        { user: socket.data.user },
        "socket connected with user data",
      );

      socket.join(`user:${userId}`);

     

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }

      onlineUsers.get(userId)!.add(socket.id);

      logger.debug(`user id: ${userId}`);

      logger.info(`🔌 @${username} connected (socket ${socket.id})`);

      registerEvents(io, socket);

      socket.on("disconnect", () => {
        const { userId, username } = socket.data.user;

        onlineUsers.delete(userId);

        logger.info(`${username} (${socket.id}) disconnected`);
      });
    } catch (error) {
      logger.error({ error }, "[Socket Error]");
    }
  });

  setIoInstance(io);

  return io;
}
