import { AuthUser } from "../shared/types";

declare global {
  namespace Express {
    interface User extends AuthUser {
      isNewUser?: boolean;
    }
    interface Request {
      user?: Express.User; 
    }
  }
}