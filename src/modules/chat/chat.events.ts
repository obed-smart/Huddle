import { Server, Socket } from "socket.io";
import chatServices from "./chat.services";

export function registerChatEvents(
    io: Server,
    socket: Socket
) {
    socket.on("send-message", (payload) => {
        chatServices.sendMessage(io, socket, payload);
    });

    // socket.on("read-message", (payload) => {
    //     chatServices.readMessage(io, socket, payload);
    // });
}