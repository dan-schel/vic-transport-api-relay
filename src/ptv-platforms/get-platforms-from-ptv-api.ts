import { env } from "../env";
import { callPtvApi } from "../utils-ptv-api";

export async function getPlatformsFromPtvApi(ptvStopID: number) {
  const json = await callPtvApi(
    `/v3/departures/route_type/0/stop/${ptvStopID}`,
    {
      expand: "All",
    },
    env.PTV_DEV_ID,
    env.PTV_DEV_KEY
  );

  return json;
}
