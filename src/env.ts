import { configDotenv } from "dotenv";
import { z } from "zod";

configDotenv();

const envSchema = z.object({
  URL: z.string().default("http://localhost:3000"),
  PORT: z.string().default("3000"),
  NODE_ENV: z.string().default("development"),
  VTAR_KEY: z.string().nullable().default(null),

  GTFS_REFRESH_HOURS: z.number().default(6),
  GTFS_REALTIME_REFRESH_SECONDS: z.number().default(20),
  PTV_DISRUPTIONS_REFRESH_MINUTES: z.number().default(5),

  PTV_DEV_ID: z.string(),
  PTV_DEV_KEY: z.string(),
  GTFS_REALTIME_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
