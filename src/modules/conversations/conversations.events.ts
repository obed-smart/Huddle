import { Server, Socket } from "socket.io";


export function registerChatEvents(
    io: Server,
    socket: Socket
) {
    socket.on("send-message", (payload) => {
       
    });

    // socket.on("read-message", (payload) => {
    //     chatServices.readMessage(io, socket, payload);
    // });
}