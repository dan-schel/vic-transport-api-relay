import { env } from "./env";

export abstract class DataService {
  abstract init(): Promise<void>;
  abstract onListening(): void;
  abstract getStatus(): object;
}

export abstract class PollingDataService extends DataService {
  private _attemptedAt: Date | null = null;
  private _succeededAt: Date | null = null;
  private _modifiedAt: Date | null = null;
  private _hash: string | null = null;

  constructor(private _dataName: string, private _pollMillis: number) {
    super();
  }

  override async init() {
    console.log(`Downloading initial ${this._dataName}...`);

    this._attemptedAt = new Date();
    this._hash = await this._downloadData();
    this._succeededAt = new Date();

    // This is our first data. We don't know.
    this._modifiedAt = null;
  }

  override onListening(): void {
    setInterval(() => {
      this._refreshData();
    }, this._pollMillis);
  }

  override getStatus(): object {
    return {
      hash: this._hash,
      url: env.URL + this._getUrl(),
      attemptedAt: this._attemptedAt?.toISOString() ?? null,
      succeededAt: this._succeededAt?.toISOString() ?? null,
      modifiedAt: this._modifiedAt?.toISOString() ?? null,
      ...this._getAdditionalStatus(),
    };
  }

  private async _refreshData() {
    try {
      console.log(`Refreshing ${this._dataName}...`);

      this._attemptedAt = new Date();
      const newHash = await this._downloadData();
      this._succeededAt = new Date();
      if (newHash !== this._hash) {
        this._modifiedAt = new Date();
      }
      this._hash = newHash;
    } catch (err) {
      console.warn(`Failed to refresh ${this._dataName}. Retaining old data.`);
      console.warn(err);
    }
  }

  protected abstract _downloadData(): Promise<string>;

  protected abstract _getUrl(): string;

  protected _getAdditionalStatus(): object {
    return {};
  }
}
