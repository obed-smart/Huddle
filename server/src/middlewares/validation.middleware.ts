import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import AppError from "../shared/utils/apiError";

type RequestProperty = "body" | "query" | "params";

const validate =
  (schema: ZodType, property: RequestProperty = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");

      throw new AppError(message, 400);
    }
    const value = result.data;

    if (property === "body") {
      req.body = value;
    } else {
      Object.assign(req[property], value);
    }

    next();
  };

export default validate;
