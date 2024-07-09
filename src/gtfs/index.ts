import { DataService } from "../service";
import { downloadGtfs } from "./utils";

// Refresh the gtfs.zip every 6 hours.
const refreshInterval = 1000 * 60 * 60 * 6;

export class GtfsDataService extends DataService {
  private _attemptedAt: Date | null = null;
  private _succeededAt: Date | null = null;
  private _modifiedAt: Date | null = null;
  private _hash: string | null = null;

  async init(): Promise<void> {
    console.log(`Downloading initial gtfs.zip...`);

    this._attemptedAt = new Date();
    this._hash = await downloadGtfs();
    this._succeededAt = new Date();

    // This is our first data. We don't know.
    this._modifiedAt = null;
  }

  onListening(): void {
    // Periodically refresh gtfs.zip.
    setInterval(() => this._refreshData(), refreshInterval);
  }

  getStatus(): object {
    return {
      hash: this._hash,
      attemptedAt: this._attemptedAt?.toISOString() ?? null,
      succeededAt: this._succeededAt?.toISOString() ?? null,
      modifiedAt: this._modifiedAt?.toISOString() ?? null,
    };
  }

  private async _refreshData() {
    try {
      console.log(`Refreshing gtfs.zip...`);

      this._attemptedAt = new Date();
      const newHash = await downloadGtfs();
      this._succeededAt = new Date();
      if (newHash !== this._hash) {
        this._modifiedAt = new Date();
      }
      this._hash = newHash;
    } catch (err) {
      console.warn("Failed to refresh gtfs.zip. Retaining old data.");
      console.warn(err);
    }
  }
}
