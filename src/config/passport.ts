import { Request } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { comparePassword, generateUniqueUsername } from "../shared/utils/utits";
import { userService } from "../modules/user/user.modules";
import logger from "../shared/utils/logger";

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

        const isMatch = await comparePassword(password, user.password);

        logger.debug(`Bcrypt password match result: ${isMatch}`);

        if (!isMatch) {
          return done(null, false, { message: "invalid credentials" });
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
  secretOrKey: process.env.JWT_ACCESS_SECRET || "access_secret_key",
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await userService.findAuthUserById(jwtPayload.sub);
      if (!user) return done(null, false);
      return done(null, user);
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
      callbackURL: "http://localhost:8080/api/v1/auth/google/callback",
    },
    async (accessToken, refereshToken, profile, done: Function) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false);

        let user = await userService.findAuthUserByGoogleId(profile.id);
        let isNewUser = false;

        if (!user) {
          const username = await generateUniqueUsername(profile.displayName);

          user = await userService.createUser({
            email,
            username,
            displayName: profile.displayName || username,
            googleId: profile.id,
            provider: "google",
            avatarUrl: profile.photos?.[0]?.value || null,
          });

          isNewUser = true;
        }

        return done(null, { user, isNewUser });
      } catch (error) {
        console.error("REAL ERROR:", error);
        // console.error("CAUSE:", error.cause);
        return done(error);
      }
    },
  ),
);
