import { configDotenv } from "dotenv";
import { z } from "zod";

configDotenv();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.string().default("development"),
  VTAR_KEY: z.string().nullable().default(null),
  GTFS_REFRESH_HOURS: z.number().default(6),
});

export const env = envSchema.parse(process.env);
