import { Server, Socket } from "socket.io";
import { registerRoomEvents } from "../modules/room/room.events";
import { messageEvent } from "../modules/message/message.event";
import { conversationEvent } from "../modules/conversations/conversations.events";

export function registerEvents(io: Server, socket: Socket) {
  messageEvent(io, socket);
  conversationEvent(io, socket);
  registerRoomEvents(io, socket);
  // registerPresenceEvents(io, socket);
}
