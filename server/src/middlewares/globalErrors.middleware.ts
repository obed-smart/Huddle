import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../shared/utils/apiResponse.js";

type ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    ...ApiResponse.error({ status: err.status, message: err.message }),
    stack: err.stack,
  });
};

const sendErrorProd = (err: any | string, req: Request, res: Response) => {
  const route = req.route?.path || req.path;

  if (err.isOperational) {
    // errorCounter.inc({
    //   method: req.method,
    //   route,
    //   status_code: String(err.statusCode),
    //   type: "operational",
    // });

    return res
      .status(err.statusCode)
      .json(ApiResponse.error({ status: err.status, message: err.message }));
  }

  //   errorCounter.inc({
  //     method: req.method,
  //     route,
  //     status_code: String(err.statusCode),
  //     type: "programming",
  //   });
};

const errorMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode =
    err.statusCode || (typeof err.status === "number" ? err.status : 500);

  const statusText =
    err.status && typeof err.status === "string"
      ? err.status
      : statusCode >= 400 && statusCode < 500
        ? "fail"
        : "error";

  err.statusCode = statusCode;
  err.status = statusText;

  if (statusCode === 401 || err.name === "AuthenticationError") {
    err.isOperational = true;
  }

  let error = err;

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

export default errorMiddleware;
