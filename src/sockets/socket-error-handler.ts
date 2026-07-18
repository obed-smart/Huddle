
import logger from "../shared/utils/logger";
import AppError from "../shared/utils/apiError";

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
