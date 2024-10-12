import { env } from "../env";
import { PollingDataService } from "../service";
import { prepareDataFolder, sha256Hash } from "../utils";
import fsp from "fs/promises";
import { fetchFromVline } from "./fetch-vline";

const dataFile = "data/scs-platforms.json";

const scsPtvCode = 1181;

export class ScsPlatformsDataService extends PollingDataService {
  constructor() {
    super("SCS Platforms", env.SCS_PLATFORMS_REFRESH_MINUTES * 60 * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    const vlinePlatforms = await fetchFromVline();

    const json = {
      [scsPtvCode]: vlinePlatforms,
    };

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(dataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return dataFile.replace(/^data\//, "/");
  }
}
