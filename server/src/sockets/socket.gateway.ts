import { Server } from "socket.io";
import { RealtimeGateway } from "../modules/conversations/conversations.types";

let ioInstance: Server;

export function setIoInstance(io: Server) {
  ioInstance = io;
}

export const socketGateway: RealtimeGateway = {
  emitToRoom(roomId, event, payload, excludeIds?: string | string[]) {
    console.log("🔵 emitToRoom called →", {
      roomId,
      event,
      payload,
      excludeIds,
    });

    const emitter = excludeIds
      ? ioInstance.to(`conversation:${roomId}`).except(excludeIds)
      : ioInstance.to(`conversation:${roomId}`);

    emitter.emit(event, payload);
  },

  emitToUser(userId, event, payload) {
    socketGateway.emitToRoom(`user:${userId}`, event, payload);
  },

  async getSocketIdsForUser(userId: string): Promise<string[]> {
    const sockets = await ioInstance.in(`user:${userId}`).fetchSockets();
    return sockets.map((s) => s.id);
  },

  async evacuateRoom(roomId: string) {
    const room = `conversation:${roomId}`;
    const sockets = await ioInstance.in(room).fetchSockets();
    for (const socket of sockets) {
      socket.leave(room);
    }
  },
};

export function disConnectSession(sessionId: string) {
  ioInstance.in(`session:${sessionId}`).disconnectSockets(true);
}
export function disConnectUser(userId: string) {
  ioInstance.in(`user:${userId}`).disconnectSockets(true);
}

// Return the connect user socket Ids using to exclude senders on Io emit
