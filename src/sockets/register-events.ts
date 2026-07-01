import { Server, Socket } from "socket.io";
import { registerChatEvents } from "../modules/chat/chat.events";
import { registerRoomEvents } from "../modules/room/room.events";

// import { registerPresenceEvents } from "../modules/presence/presence.events";

export function registerEvents(io: Server, socket: Socket) {
  registerChatEvents(io, socket);
  registerRoomEvents(io, socket);
//   registerPresenceEvents(io, socket);
}
