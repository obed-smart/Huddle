import { Socket } from "socket.io";
import * as cookie from "cookie";

import AppError from "../shared/utils/apiError";
import { verifySecret } from "../shared/utils/utits";
import logger from "../shared/utils/logger";
import { userService } from "../modules/user/user.modules";
import { authService } from "../modules/auth/auth.modules";

export async function authMiddleware(
  socket: Socket,
  next: (err?: any) => void,
) {
  try {
    const headerCookie = socket.handshake.headers.cookie;
    logger.debug(`Socket handshake cookies headers: ${headerCookie}`);

    if (!headerCookie) {
      return next(new AppError("Unauthorized: No cookies found", 401));
    }

    const cookies = cookie.parseCookie(headerCookie);
    const accessToken = cookies.accessToken;
    logger.debug(`Socket accessToken from cookies: ${accessToken}`);

    if (!accessToken) {
      return next(new AppError("Unauthorized: Missing token", 401));
    }

    const decoded = verifySecret(accessToken);
    logger.debug(`Decoded token payload: ${JSON.stringify(decoded)}`);

    if (!decoded) {
      return next(new AppError("Unauthorized: Invalid token", 401));
    }

    const newDecoded =
      typeof decoded === "string" ? JSON.parse(decoded) : decoded;

    const user = await userService.findAuthUserById(newDecoded.sub);

    logger.debug(`User fetched from database: ${JSON.stringify(user)}`);

    logger.debug(`Authenticated user: ${JSON.stringify(decoded)}`);

    if (!user) {
      return next(new AppError("Unauthorized: User no longer exists", 401));
    }

    const activeSession = await authService.isActive(newDecoded.sid);

    if (!activeSession) {
      return next(new AppError("Unauthorized: invalid session", 401));
    }

    socket.data.user = { ...user, sid: newDecoded.sid };

    next();
  } catch (err) {
    logger.error(`Socket authentication error: ${err}`);
    return next(new AppError("Unauthorized: Token verification failed", 401));
  }
}
