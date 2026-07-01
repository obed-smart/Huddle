import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import env from "./src/config/env";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migration",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
