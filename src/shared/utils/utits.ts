import bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import AppError from "./apiError";
import { IUser } from "../../db/schema/schema.user";
import logger from "./logger";
import { string } from "zod";
import { AuthUser } from "../types";
import { userService } from "../../modules/user/user.modules";
import env from "../../config/env";

const MAX_RETRIES = 5;

export const hashPassword = async (password: string) => {
  if (!password) {
    throw new AppError(
      "[password hash] cannot hash and undifine or empty value",
      400,
    );
  }

  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  inputPassword: string,
  password: string,
) => {
  return await bcrypt.compare(inputPassword, password);
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

  return jwt.verify(secrect, process.env.JWT_ACCESS_SECRET!) as IUser;
};

export const generateAccessToken = (
  user: Pick<AuthUser, "id" | "globalRole" | "username">,
) => {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.globalRole, username: user.username },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.NODE_ENV === "production" ? "15m" : "7d",
    },
  );
  return accessToken;
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const onlineUsers = new Map<string, Set<string>>();
