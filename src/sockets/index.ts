import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { authMiddleware } from "./auth.socket";
import logger from "../shared/utils/logger";
import { registerEvents } from "./register-events";

export function createSocketServer(server: HttpServer) {
  logger.debug("SOCKET.IO");
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://oauth.pstmn.io"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    logger.info(`🔌 socket.io is connected`);

   

    socket.on("message", (data) => {
      logger.debug(`message from websocket: ${data.text}`);

      logger.debug(data);
    });

    // registerEvents(io, socket);

    socket.on("disconnect", () => {
      const { userId, username } = socket.data.user;

      // logger.info(`${username} (${socket.id}) disconnected`);

      // socket.broadcast.emit("user-offline", {
      //   userId,
      //   username,
      // });
    });
  });

  return io;
}
