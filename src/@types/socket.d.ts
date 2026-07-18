import "socket.io";

declare module "socket.io" {
  interface SocketData {
    user: {
      userId: string;
      username: string;
    };
  }
}
