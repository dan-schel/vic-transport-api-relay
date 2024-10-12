import { env } from "../env";
import { DataService, PollingDataService } from "../service";
import { KnownPlatform, prepareDataFolder, sha256Hash } from "../utils";
import fsp from "fs/promises";
import { fetchFromPtvApi } from "./fetch-platforms";

const dataFile = "data/ptv-platforms.json";

const ptvStopCodes = [
  // Central stations - Should always be fetched first.
  1071, // Flinders Street
  1181, // Southern Cross
  1162, // Richmond
  1144, // North Melbourne
  1030, // Burnley

  // Stations where platforms are unpredictable.
  1012, // Auburn
  1018, // Belgrave
  1020, // Bentleigh
  1026, // Box Hill
  1032, // Camberwell
  1037, // Chatham
  1039, // Cheltenham
  1044, // Craigieburn
  1045, // Cranbourne
  1049, // Dandenong
  1057, // East Camberwell
  1230, // East Pakenham
  1062, // Eltham
  1063, // Epping
  1064, // Essendon
  1073, // Frankston
  1081, // Glen Huntly
  1078, // Glen Waverley
  1084, // Greensborough
  1090, // Hawthorn
  1113, // Laverton
  1115, // Lilydale
  1119, // McKinnon
  1228, // Mernda
  1132, // Moorabbin
  1152, // Ormond
  1157, // Patterson
  1163, // Ringwood
  1224, // South Morang
  1187, // Sunbury
  1229, // Union
  1202, // Watergardens
  1205, // Werribee
  1208, // Westall

  // Usually predictable, but not when disrupted.
  1021, // Berwick
  1036, // Caulfield
  1041, // Clifton Hill
  1051, // Darling
  1093, // Heidelberg
  1134, // Mordialloc
  1141, // Newport
  1150, // Oakleigh
  1161, // Reservoir
  1218, // Sunshine
];

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
    this._status = new Map(ptvStopCodes.map((x) => [x, "pending"]));
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

    const stopID = ptvStopCodes[this._stopIndex];
    this._stopIndex = (this._stopIndex + 1) % ptvStopCodes.length;

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
