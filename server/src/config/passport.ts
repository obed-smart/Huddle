import { Request } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { comparePassword, generateUniqueUsername } from "../shared/utils/utits";
import { userService } from "../modules/user/user.modules";
import logger from "../shared/utils/logger";
import { authService } from "../modules/auth/auth.modules";

passport.use(
  new LocalStrategy(
    { usernameField: "identifier", passwordField: "password" },
    async (identifier: string, password: string, done: Function) => {
      logger.debug(`Loging in with identifier: ${identifier}`);
      try {
        const user = await userService.findUserForLogin(identifier);

        logger.debug(
          `User query result: ${user ? JSON.stringify({ id: user.id, username: user.username }) : "NULL"}`,
        );
        if (!user) return done(null, false, { message: "invalid credentials" });

        logger.debug(`User password hash present: ${!!user.password}`);

        if (!user.password) {
          return done(null, false, { message: "invalid credentials" });
        }

        logger.debug("passwprd reach");
        const isMatch = await comparePassword(password, user.password);
        logger.debug("password pass");

        logger.debug(`Bcrypt password match result: ${isMatch}`);

        if (!isMatch) {
          return done(null, false, { message: "invalid credentials" });
        }

        if (!user.isEmailVerified) {
          return done(null, false, { message: "EMAIL_UNVERIFIED_CODE" });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Passport strategy error: ${error}`);
        return done(error);
      }
    },
  ),
);

const cookieExtractor = (req: Request): string | null => {
  let token = null;

  if (req && req.cookies) {
    token = req.cookies["accessToken"];
  }
  return token;
};

const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_ACCESS_SECRET!,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const active = authService.isActive(jwtPayload.sid);

      if (!active) return done(null, false);

      const user = await userService.findAuthUserById(jwtPayload.sub);
      if (!user) return done(null, false);

      return done(null, { ...user, sid: jwtPayload.sid });
    } catch (error) {
      return done(error);
    }
  }),
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done: Function) => {
      try {
        done(null, await authService.googleLogin(profile));
      } catch (err) {
        done(err as Error);
      }
    },
  ),
);
