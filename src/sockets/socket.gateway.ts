import { Server } from "socket.io";
import { RealtimeGateway } from "../modules/conversations/conversations.types";

let ioInstance: Server;

export function setIoInstance(io: Server) {
  ioInstance = io;
}

export const socketGateway: RealtimeGateway = {
  emitToRoom(roomName, event, payload) {
    console.log("🔵 emitToRoom called →", { roomName, event, payload });
    console.log("🔵 rooms currently on io:", [
      ...ioInstance.sockets.adapter.rooms.keys(),
    ]);
    ioInstance.to(roomName).emit(event, payload);
  },

  emitToUser(userId, event, payload) {
    socketGateway.emitToRoom(`user:${userId}`, event, payload);
  },
};
