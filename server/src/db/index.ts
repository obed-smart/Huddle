import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

import "dotenv/config";
import env from "../config/env";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({
  client: pool,
  schema: { ...schema },
  logger: env.NODE_ENV === "development",
});

export async function testDatabaseConnection(): Promise<void> {
  await pool.query("SELECT 1");
}
