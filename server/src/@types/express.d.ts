import { AuthUser } from "../shared/types";

declare global {
  namespace Express {
    interface User extends AuthUser {
      isNewUser?: boolean;
      sid: string;
    }
    interface Request {
      user?: Express.User;
    }
  }
}
