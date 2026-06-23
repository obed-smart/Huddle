import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", true);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Huddle API",
    version: "v1",
    status: "running",
  });
});

export default app;
