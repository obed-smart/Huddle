import { Socket } from "socket.io";
import * as cookie from "cookie";

import { IUser } from "../db/schema/schema.user";
import AppError from "../shared/utils/apiError";
import { verifySecret } from "../shared/utils/utits";


export function authMiddleware(socket: Socket, next: (err?: any) => void) {

  try {
    const headerCookie = socket.handshake.headers.cookie;

    if (!headerCookie) {
      return next(new AppError("Unauthorized: No cookies found", 401));
    }

    
    const cookies = cookie.parseCookie(headerCookie);
    const accessToken = cookies.accessToken; 

    if (!accessToken) {
      return next(new AppError("Unauthorized: Missing token", 401));
    }

    const decoded = verifySecret(accessToken);

    if (!decoded) {
      return next(new AppError("Unauthorized: Invalid token", 401));
    }

    socket.data.user = decoded;

    next();
  } catch (err) {
    return next(new AppError("Unauthorized: Token verification failed", 401));
  }
}
