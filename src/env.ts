import { parseFloatNull } from "@dan-schel/js-utils";
import { configDotenv } from "dotenv";
import { z } from "zod";

configDotenv({ quiet: true });

const stringNumberSchema = z.string().transform((x, ctx) => {
  const result = parseFloatNull(x);
  if (result == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a number.",
    });
    return z.NEVER;
  }
  return result;
});

const stringBooleanSchema = z
  .enum(["true", "false"])
  .transform((x) => x === "true");

const envSchema = z.object({
  URL: z.string().default("http://localhost:3000"),
  PORT: z.string().default("3000"),
  NODE_ENV: z.string().default("development"),
  NPM_CONFIG_PRODUCTION: z.string().default("false"),
  RELAY_KEY: z.string().nullable().default(null),
  DATABASE_URL: z.string().optional(),

  GTFS_REFRESH_HOURS: stringNumberSchema.default("6"),
  GTFS_REALTIME_REFRESH_SECONDS: stringNumberSchema.default("20"),
  PTV_DISRUPTIONS_REFRESH_MINUTES: stringNumberSchema.default("5"),
  PTV_DISRUPTION_DETAILS_LIMIT_WINDOW_MINUTES: stringNumberSchema.default("60"),
  PTV_DISRUPTION_DETAILS_LIMIT_COUNT: stringNumberSchema.default("10"),
  PTV_DISRUPTION_DETAILS_CACHE_MINUTES: stringNumberSchema.default("120"),
  PTV_PLATFORMS_INITIAL_FETCH_SECONDS: stringNumberSchema.default("10"),
  PTV_PLATFORMS_REGULAR_FETCH_SECONDS: stringNumberSchema.default("120"),
  SCS_PLATFORMS_REFRESH_MINUTES: stringNumberSchema.default("10"),
  PTV_STOPS_REFRESH_MINUTES: stringNumberSchema.default("60"),

  PTV_DEV_ID: z.string(),
  PTV_DEV_KEY: z.string(),
  GTFS_REALTIME_KEY: z.string(),

  GTFS_ENABLED: stringBooleanSchema.default("true"),
  GTFS_REALTIME_ENABLED: stringBooleanSchema.default("true"),
  PTV_DISRUPTIONS_ENABLED: stringBooleanSchema.default("true"),
  PTV_DISRUPTION_DETAILS_ENABLED: stringBooleanSchema.default("true"),
  PTV_PLATFORMS_ENABLED: stringBooleanSchema.default("true"),
  SCS_PLATFORMS_ENABLED: stringBooleanSchema.default("true"),
  PTV_STOPS_ENABLED: stringBooleanSchema.default("true"),
});

export const env = envSchema.parse(process.env);
