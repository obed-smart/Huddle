import { z } from "zod";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const envSchema = z.object({
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().default(3000)),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.url("DATABASE_URL must be a valid URL"),
  ),
  JWT_ACCESS_SECRET: z.preprocess(
    emptyToUndefined,
    z.string("JWT_ACCESS_SECRET is required"),
  ),
  FRONTEND_URL: z.preprocess(
    emptyToUndefined,
    z.string("FRONTEND_URL is required"),
  ),
  REFRESH_TOKEN_LIFESPAN_DAYS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().default(7),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:\n");

  for (const issue of parsed.error.issues) {
    const errorField = issue.path.join(".") || "root";
    console.error(`❌ ${errorField}: ${issue.message}`);
  }

  process.exit(1);
}

const env = parsed.data;

export default env;
