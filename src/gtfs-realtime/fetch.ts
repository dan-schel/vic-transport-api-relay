import { transit_realtime } from "./proto";
import { nonNull } from "@dan-schel/js-utils";

const apis = [
  "https://data-exchange-api.vicroads.vic.gov.au/opendata/v1/gtfsr/metrotrain-tripupdates",
  "https://data-exchange-api.vicroads.vic.gov.au/opendata/v1/gtfsr/metrotrain-servicealerts",
  "https://data-exchange-api.vicroads.vic.gov.au/opendata/v1/gtfsr/metrotrain-vehicleposition-updates",
];

export type GtfsRealtimeData = {
  tripUpdates: transit_realtime.ITripUpdate[];
  serviceAlerts: transit_realtime.IAlert[];
  vehiclePositions: transit_realtime.IVehiclePosition[];
};

export async function fetchRealtime(apiKey: string): Promise<GtfsRealtimeData> {
  const results = await Promise.all(
    apis.map((api) => fetchRealtimeApi(api, apiKey))
  );

  const combined = results.map((e) => e.entity).flat();
  return {
    tripUpdates: combined.map((e) => e.tripUpdate ?? null).filter(nonNull),
    serviceAlerts: combined.map((e) => e.alert ?? null).filter(nonNull),
    vehiclePositions: combined.map((e) => e.vehicle ?? null).filter(nonNull),
  };
}

async function fetchRealtimeApi(
  api: string,
  apiKey: string
): Promise<transit_realtime.FeedMessage> {
  const response = await fetch(api, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
    },
  });
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const message = transit_realtime.FeedMessage.decode(bytes);
  return message;
}
