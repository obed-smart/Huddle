import express, { Request, Response } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";
import path from "path";

import "./config/passport";
import httpLogger from "./middlewares/pino.http.middleware";
import { testDatabaseConnection } from "./db";
import logger from "./shared/utils/logger";
import AppError from "./shared/utils/apiError";
import { ApiResponse } from "./shared/utils/apiResponse";
import GlobalErrorHandler from "./middlewares/globalErrors.middleware";
import routes from "./routers/index";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isDev
          ? [
              "'self'",
              "'unsafe-inline'",
              "https://cdn.tailwindcss.com",
              "https://unpkg.com",
              "https://cdn.socket.io",
            ]
          : ["'self'"],
        styleSrc: isDev
          ? ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"]
          : ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

app.set("trust proxy", true);
app.use(httpLogger);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../../test-ui")));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:8080",
  "https://oauth.pstmn.io",
  "https://mainland-essentials-roles-fitting.trycloudflare.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// const staticOrigins = [
//   process.env.FRONTEND_URL,
//   "http://127.0.0.1:5500",
//   "http://localhost:5500",
// ];
// const tunnelPattern = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       if (staticOrigins.includes(origin) || tunnelPattern.test(origin)) {
//         return callback(null, true);
//       }
//       callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   }),
// );

app.use(passport.initialize());

app.get("/api", (req, res) => {
  res.json(
    ApiResponse.success({
      service: "Huddle API",
      version: "v1",
      status: "running",
    }),
  );
});

// app.get("/", (req, res) => {
//   res.render("login");
// });

app.get("/health", async (req: Request, res: Response) => {
  const healthStatus = {
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: "UNKNOWN",
    },
  };

  try {
    await testDatabaseConnection();
    healthStatus.services.database = "UP";

    return res.status(200).json(ApiResponse.success(healthStatus));
  } catch (error) {
    logger.error(`Healthcheck failed: ${error}`);

    healthStatus.status = "DOWN";
    healthStatus.services.database = "DOWN";

    return res.status(503).json(ApiResponse.success(healthStatus));
  }
});
// app.use("/", testRoutes);
app.use("/api/v1", routes);

app.use((req, res, next) => {
  logger.error(`Can't find ${req.originalUrl} on this server!`);
  throw new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
});

app.use(GlobalErrorHandler);

export default app;
