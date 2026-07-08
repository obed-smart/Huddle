import { Request, Response, NextFunction } from "express";
import { IUser } from "../db/schema/schema.user";
import passport from "passport";
import { AuthUser } from "../shared/types";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error | null, user: AuthUser | false) => {
      if (err) return next(err);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
      next();
    },
  )(req, res, next);
};

export default authenticate;
