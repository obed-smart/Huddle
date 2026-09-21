import logger from "../shared/utils/logger";
import AppError from "../shared/utils/apiError";
import { ZodType } from "zod";

export function catchSocketAsync<T extends any[]>(
  handler: (...args: T) => Promise<void>,
) {
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (error) {
      logger.error(error);

      const callback = args.at(-1);

      if (typeof callback === "function") {
        if (error instanceof AppError) {
          callback({
            success: false,
            message: error.message,
            statusCode: error.statusCode,
          });
        } else {
          callback({
            success: false,
            message: "Internal server error",
            statusCode: 500,
          });
        }
      }
    }
  };
}

export function validateSocketData<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new AppError(message, 400);
  }

  return result.data;
}
