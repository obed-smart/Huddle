import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import env from "./src/config/env";

console.log("Migrating with URL:", env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migration",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
