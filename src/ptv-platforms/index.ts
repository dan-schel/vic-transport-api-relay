import { env } from "../env";
import { PollingDataService } from "../service";
import { prepareDataFolder, sha256Hash } from "../utils";
import fsp from "fs/promises";
import { fetchFromPtvApi } from "./platforms-ptv-api";
import { fetchFromVline } from "./platforms-vline";

const dataFile = "data/ptv-platforms.json";

const fssPtvCode = 1071;
const scsPtvCode = 1181;

export class PtvPlatformsDataService extends PollingDataService {
  constructor() {
    super("PTV Platforms", env.PTV_PLATFORMS_REFRESH_MINUTES * 60 * 1000);
  }

  protected override async _downloadData(): Promise<string> {
    // TODO: Add more stations (maybe spread the requests out over the refresh
    // cycle).
    const requests = await Promise.allSettled([
      fetchFromPtvApi(fssPtvCode),
      fetchFromVline(),
      fetchFromPtvApi(scsPtvCode),
    ]);

    const [fssPtv, scsVline, scsPtv] = requests;

    const json = {
      [fssPtvCode]: fssPtv.status === "fulfilled" ? fssPtv.value : [],
      [scsPtvCode]: [
        ...(scsVline.status === "fulfilled" ? scsVline.value : []),
        ...(scsPtv.status === "fulfilled" ? scsPtv.value : []),
      ],
    };

    // TODO: Better error handling. Ideally it should update the status
    // indicator if there's any failures (and maybe report on the broken
    // station names in the full status object).
    if (requests.some((r) => r.status === "rejected")) {
      console.warn("Some platform fetching was unsuccessful.");
    }

    const jsonStr = JSON.stringify(json, null, 2);
    await prepareDataFolder();
    await fsp.writeFile(dataFile, jsonStr);

    return sha256Hash(jsonStr);
  }

  protected override _getUrl(): string {
    return dataFile.replace(/^data\//, "/");
  }
}
