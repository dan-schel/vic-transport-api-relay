import { env } from "../env";
import { PollingDataService } from "../service";
import { prepareDataFolder, sha256Hash } from "../utils";
import { fetchRealtime } from "./fetch";
import fsp from "fs/promises";

const suburbanDataFile = "data/gtfs-realtime-suburban.json";
const regionalDataFile = "data/gtfs-realtime-regional.json";

export class SuburbanGtfsRealtimeDataService extends PollingDataService {
  constructor() {
    super("GTFS-R Suburban", env.GTFS_REALTIME_REFRESH_SECONDS * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    const json = await fetchRealtime(env.GTFS_REALTIME_KEY, [
      "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/metro/trip-updates",
      "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/metro/vehicle-positions",
      "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/metro/service-alerts",
    ]);

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(suburbanDataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return suburbanDataFile.replace(/^data\//, "/");
  }
}

export class RegionalGtfsRealtimeDataService extends PollingDataService {
  constructor() {
    super("GTFS-R Regional", env.GTFS_REALTIME_REFRESH_SECONDS * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    const json = await fetchRealtime(env.GTFS_REALTIME_KEY, [
      "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/vline/trip-updates",
      "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/vline/vehicle-positions",
    ]);

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(regionalDataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return regionalDataFile.replace(/^data\//, "/");
  }
}
