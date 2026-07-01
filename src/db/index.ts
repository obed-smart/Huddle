import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as userSchema from "./schema/schema.user";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({
  client: pool,
  schema: { ...userSchema },
});

export async function testDatabaseConnection(): Promise<void> {
  await pool.query("SELECT 1");
}
