import { env } from "../env";
import { PollingDataService } from "../service";
import { prepareDataFolder, sha256Hash } from "../utils";
import { fetchRealtime } from "./fetch";
import fsp from "fs/promises";

const dataFile = "data/gtfs-realtime.json";

export class GtfsRealtimeDataService extends PollingDataService {
  constructor() {
    super("GTFS-R", env.GTFS_REALTIME_REFRESH_SECONDS * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    const json = await fetchRealtime(env.GTFS_REALTIME_KEY);

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(dataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return dataFile.replace(/^data\//, "/");
  }
}
