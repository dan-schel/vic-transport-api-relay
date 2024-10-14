import { env } from "../env";
import { DataService } from "../service";
import { KnownPlatform, prepareDataFolder } from "../utils";
import fsp from "fs/promises";
import { fetchFromPtvApi } from "./fetch-platforms";
import { stops } from "./stops";

const dataFile = "data/ptv-platforms.json";

export class PtvPlatformsDataService extends DataService {
  private readonly _initialFetchInterval;
  private readonly _regularFetchInterval;
  private _stopIndex;
  private _knownPlatforms: Map<number, KnownPlatform[]>;
  private _status: Map<number, "pending" | "success" | "failure">;
  private _succeededAt: Date | null;
  private _failedAt: Date | null;

  constructor() {
    super();
    this._initialFetchInterval = env.PTV_PLATFORMS_INITIAL_FETCH_SECONDS * 1000;
    this._regularFetchInterval = env.PTV_PLATFORMS_REGULAR_FETCH_SECONDS * 1000;
    this._stopIndex = 0;
    this._knownPlatforms = new Map();
    this._status = new Map(stops.map((x) => [x, "pending"]));
    this._succeededAt = null;
    this._failedAt = null;
  }

  override async init(): Promise<void> {
    // The only stop which we fetch platforms for on startup is Flinders Street.
    // It means VTAR will always have platform information for Flinders Street,
    // and also acts as a test call which will block startup if it fails.
    await this.fetchNext({ scheduleNext: false });
  }

  override onListening(): void {
    this._scheduleNextFetch();
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

  async fetchNext({ scheduleNext = true } = {}): Promise<void> {
    if (scheduleNext) {
      this._scheduleNextFetch();
    }

    const stopID = stops[this._stopIndex];
    this._stopIndex = (this._stopIndex + 1) % stops.length;

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

  private _scheduleNextFetch() {
    const pending = Array.from(this._status.values()).includes("pending");
    const interval = pending
      ? this._initialFetchInterval
      : this._regularFetchInterval;
    setTimeout(() => this.fetchNext(), interval);
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
