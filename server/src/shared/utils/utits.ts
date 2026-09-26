import bcrypt from "bcrypt";
import argon2 from "argon2";
import { customAlphabet } from "nanoid";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import AppError from "./apiError";
import { IUser } from "../../db/schema/schema.user";
import logger from "./logger";

import { AuthUser } from "../types";
import { userService } from "../../modules/user/user.modules";
import env from "../../config/env";
import { conversationService } from "../../modules/conversations/conversations.modules";

const MAX_RETRIES = 5;

const nanoid = customAlphabet("abcdefghijkmnopqrstuvwxyz23456789", 10);

export const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw new AppError(
      "[password hash] cannot hash and undifine or empty value",
      400,
    );
  }

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
  });
};

export const comparePassword = async (
  Password: string,
  passwordHash: string,
) => {
  if (passwordHash.startsWith("$argon2")) {
    return argon2.verify(passwordHash, Password);
  }
  if (passwordHash.startsWith("$2")) {
    return bcrypt.compare(Password, passwordHash);
  }
  throw new AppError("Unrecognized password hash format", 401);
};

export const generateUniqueUsername = async (displayName: string) => {
  const usernameId = customAlphabet("abcdefghijkmnopqrstuvwxyz23456789", 4);

  const cleanedName = displayName
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  let retries = 0;

  try {
    while (retries < MAX_RETRIES) {
      const id = usernameId();

      const uniqueName = `${cleanedName}_${id}`;

      const usernameExist = await userService.userNameExists(uniqueName);

      if (!usernameExist) {
        return uniqueName;
      }
      retries++;
    }

    return `${cleanedName}_${usernameId()}`;
  } catch (error) {
    throw new AppError(
      "failed when generating username from google displayName",
      500,
    );
    logger.error(error);
  }
};

export const hashToken = (token: string) => {
  if (!token) {
    throw new AppError(
      "[hashToken Error] Cannot hash an undefined or empty token value.",
      400,
    );
  }

  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifySecret = (secrect: string) => {
  if (!secrect) {
    throw new AppError(
      "[hashToken Error] Cannot hash an undefined or empty secret value.",
      400,
    );
  }

  return jwt.verify(secrect, process.env.JWT_ACCESS_SECRET!);
};

export const generateAccessToken = (user: {
  id: string;
  username: string;
  globalRole: string;
  sessionId: string;
}) => {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      sid: user.sessionId,
      role: user.globalRole,
      username: user.username,
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: "HS256",
      expiresIn: env.NODE_ENV === "production" ? "15m" : "7d",
    },
  );
  return accessToken;
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const onlineUsers = new Map<string, Set<string>>();


export const generateCode = async () => {
  let retries = 0;

  try {
    while (retries < MAX_RETRIES) {
      const secretId = nanoid();

      const exists = await conversationService.checkInviteCode(secretId);

      if (!exists) {
        return secretId;
      }

      retries++;
    }
    throw new AppError("Could not generate unique ID after retries", 500);
  } catch (error) {
    logger.error({ error }, "Error generating ID:");
    throw new AppError("Failed to generate unique ID", 500);
  }
};
