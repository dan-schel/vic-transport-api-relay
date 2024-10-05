import { env } from "../env";
import { PollingDataService } from "../service";
import { prepareDataFolder, sha256Hash } from "../utils";
import fsp from "fs/promises";
import { getPlatformsFromPtvApi } from "./get-platforms-from-ptv-api";

const dataFile = "data/ptv-platforms.json";

const fssPtvCode = 1071;

export class PtvPlatformsDataService extends PollingDataService {
  constructor() {
    super("PTV Platforms", env.PTV_PLATFORMS_REFRESH_MINUTES * 60 * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    const json = await getPlatformsFromPtvApi(fssPtvCode);

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(dataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return dataFile.replace(/^data\//, "/");
  }
}
