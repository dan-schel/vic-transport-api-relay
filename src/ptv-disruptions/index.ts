import { env } from "../env";
import { PollingDataService } from "../service";
import { prepareDataFolder, sha256Hash } from "../utils";
import { callPtvApi } from "../utils-ptv-api";
import fsp from "fs/promises";

const dataFile = "data/ptv-disruptions.json";

export class PtvDisruptionsDataService extends PollingDataService {
  constructor() {
    super("PTV Disruptions", env.PTV_DISRUPTIONS_REFRESH_MINUTES * 60 * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    const json = await callPtvApi(
      "/v3/disruptions",
      {
        route_types: ["0", "3"],
      },
      env.PTV_DEV_ID,
      env.PTV_DEV_KEY
    );

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(dataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return dataFile.replace(/^data\//, "/");
  }
}
