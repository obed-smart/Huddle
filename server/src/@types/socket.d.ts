import "socket.io";
import { AuthUser } from "../shared/types";

export type SocketUser = AuthUser & {
  sid: string;
};

declare module "socket.io" {
  interface SocketData {
    user: SocketUser;
  }
}
