import { Server, Socket } from "socket.io";
import { SendMessageDto } from "./chat.types";

class ChatService {
  async sendMessage(io: Server, socket: Socket, payload: SendMessageDto) {
    const { username, userId } = socket.data.user;

    // Save to database

    // Update unread count

    // Emit

    io.to(payload.roomId).emit("new-message", {
      from: username,
      userId,
      content: payload.content,
      timestamp: new Date().toISOString(),
    });
  }
  //   async readMessage(io: Server, socket: Socket, payload: any) {}
}

export default new ChatService();
