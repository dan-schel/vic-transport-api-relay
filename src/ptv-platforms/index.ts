import { env } from "../env";
import { DataService, PollingDataService } from "../service";
import { KnownPlatform, prepareDataFolder, sha256Hash } from "../utils";
import fsp from "fs/promises";
import { fetchFromPtvApi } from "./fetch-platforms";

const dataFile = "data/ptv-platforms.json";

const ptvStopCodes = [
  1071, // Flinders Street
  1181, // Southern Cross
];

export class PtvPlatformsDataService extends DataService {
  private readonly _fetchInterval;
  private _stopIndex;
  private _knownPlatforms: Map<number, KnownPlatform[]>;
  private _status: Map<number, "pending" | "success" | "failure">;
  private _succeededAt: Date | null;
  private _failedAt: Date | null;

  constructor() {
    super();
    this._fetchInterval = env.PTV_PLATFORMS_FETCH_SECONDS * 1000;
    this._stopIndex = 0;
    this._knownPlatforms = new Map();
    this._status = new Map(ptvStopCodes.map((x) => [x, "pending"]));
    this._succeededAt = null;
    this._failedAt = null;
  }

  override async init(): Promise<void> {
    // The only stop which we fetch platforms for on startup is Flinders Street.
    // It means VTAR will always have platform information for Flinders Street,
    // and also acts as a test call which will block startup if it fails.
    await this.fetchNext();
  }

  override onListening(): void {
    setInterval(() => this.fetchNext(), this._fetchInterval);
  }

  override getStatus(): object {
    const allStatuses = Array.from(this._status.values());
    const successes = allStatuses.filter((x) => x == "success").length;
    const pendings = allStatuses.filter((x) => x == "pending").length;
    const failures = allStatuses.filter((x) => x == "failure").length;

    return {
      status: this._overallStatus(allStatuses),
      url: env.URL + dataFile.replace(/^data\//, "/"),
      platforms: `${successes} successful, ${pendings} pending, ${failures} failed`,
      succeededAt: this._succeededAt?.toISOString() ?? null,
      failedAt: this._failedAt?.toISOString() ?? null,
    };
  }

  async fetchNext() {
    const stopID = ptvStopCodes[this._stopIndex];
    this._stopIndex++;

    try {
      const platforms = await fetchFromPtvApi(stopID);
      this._knownPlatforms.set(stopID, platforms);

      const json = Object.fromEntries(this._knownPlatforms.entries());
      const jsonStr = JSON.stringify(json, null, 2);
      await prepareDataFolder();
      await fsp.writeFile(dataFile, jsonStr);

      this._status.set(stopID, "success");
      this._succeededAt = new Date();
    } catch (err) {
      this._status.set(stopID, "failure");
      this._failedAt = new Date();
      console.warn(
        `Failed to fetch platform data for stop ${stopID}. Retaining old data if available.`
      );
      console.warn(err);
    }
  }

  private _overallStatus(allStatuses: ("success" | "failure" | "pending")[]) {
    if (allStatuses.every((x) => x != "success")) {
      return "dead";
    } else if (allStatuses.some((x) => x == "failure")) {
      return "flaky";
    } else if (allStatuses.some((x) => x == "pending")) {
      return "populating";
    } else {
      return "healthy";
    }
  }
}
