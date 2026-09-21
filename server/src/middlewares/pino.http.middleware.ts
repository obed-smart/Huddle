import pinoHttp from "pino-http";
import { nanoid } from "nanoid";
import { Request, Response } from "express";
import logger from "../shared/utils/logger";

const httpLogger = pinoHttp({
  logger,

  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) return "error";

    if (res.statusCode >= 400) return "warn";

    return "info";
  },

  autoLogging: {
    ignore: (req) => {
      const url = req.url ?? "";

      return url.startsWith("/health") || url.startsWith("/metrics");
    },
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed`;
  },

  customErrorMessage(req, res) {
    return `${req.method} ${req.url} failed`;
  },

  genReqId(req) {
    return (req.headers["x-request-id"] as string) || nanoid(12);
  },

  customProps(req) {
    const request = req as Request;

    return {
      requestId: request.id,
      // userId: request.user?.id,
    };
  },

  serializers: {
    req(req: Request) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        // userId: req.user?._id ?? null,
      };
    },

    res(res: any) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default httpLogger;
