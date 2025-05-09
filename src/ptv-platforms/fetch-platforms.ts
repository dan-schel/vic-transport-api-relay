import { z } from "zod";
import { env } from "../env";
import { callPtvApi } from "../utils-ptv-api";
import { nonNull } from "@dan-schel/js-utils";
import { cleanString, KnownPlatform } from "../utils";
import { getOverrideFor } from "./overrides";

const dirtyString = z.string().transform((s) => cleanString(s));

// Filter out departures that are more than 1 hour in the past.
const backBufferMillis = 1 * 60 * 60 * 1000;

const schema = z.object({
  departures: z
    .object({
      run_ref: z.string(),
      platform_number: dirtyString.transform((x) => x.toLowerCase()).nullable(),
      scheduled_departure_utc: z.coerce.date(),
    })
    .array(),
  runs: z.object({}).catchall(
    z.object({
      final_stop_id: z.number(),
      destination_name: dirtyString,
      route_id: z.number(),
      direction_id: z.number(),
    }),
  ),
});

export async function fetchFromPtvApi(
  ptvStopID: number,
): Promise<KnownPlatform[]> {
  const json = await callPtvApi(
    `/v3/departures/route_type/0/stop/${ptvStopID}`,
    {
      expand: "All",
    },
    env.PTV_DEV_ID,
    env.PTV_DEV_KEY,
  );

  const rawData = schema.parse(json);

  const result = rawData.departures
    .map((x) => {
      const run = rawData.runs[x.run_ref];
      if (!run || x.platform_number == null) {
        return null;
      }

      const override = getOverrideFor(
        run.route_id,
        run.direction_id,
        run.final_stop_id,
      );

      return {
        terminus: override?.final_stop_id ?? run.final_stop_id,
        terminusName: override?.destination_name ?? run.destination_name,
        scheduledDepartureTime: x.scheduled_departure_utc,
        platform: x.platform_number,
      };
    })
    .filter(nonNull)
    .filter(
      (x) => x.scheduledDepartureTime.getTime() > Date.now() - backBufferMillis,
    );

  result.sort(
    (a, b) =>
      a.scheduledDepartureTime.getTime() - b.scheduledDepartureTime.getTime(),
  );

  return result;
}
