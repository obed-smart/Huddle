import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: isProduction ? "info" : "debug",

  base: {
    service: "HUDDLE_API",
    env: process.env.NODE_ENV,
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  ...(!isProduction && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),

  serializers: {
    err: isProduction
      ? (err: any) => ({
          type: err.name,
          message: err.message,
          statusCode: err.statusCode,
        })
      : pino.stdSerializers.err,
  },
});

export default logger;
