import { AuthUser } from "../shared/types";

declare global {
  namespace Express {
    interface PassportNewCustomUser {
      user: AuthUser;
      isNewUser: boolean;
    }

    // interface User extends AuthUser {
    //   isNewUser?: boolean;
    // }

    interface User extends AuthUser, Partial<PassportNewCustomUser> {
      sid: string;
    }

    interface Request {
      user?: Express.User;
    }
  }
}
