import { env } from "./env";

// How many successful attempts must occur before a recent failure is no longer
// reflected in the status.
const flakyWindow = 5;

const staleAfterLifecycles = 1.1;
const deadAfterLifecycles = 3.1;

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
  private _flakyCountdown: number = 0;

  constructor(private _dataName: string, private _pollMillis: number) {
    super();
  }

  override async init() {
    console.log(`Downloading initial ${this._dataName}...`);

    this._attemptedAt = new Date();
    this._hash = await this._downloadData();
    this._succeededAt = new Date();
    this._flakyCountdown = 0;

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
      status: this._calculateStatus(),
      url: env.URL + this._getUrl(),
      hash: this._hash,
      attemptedAt: this._attemptedAt?.toISOString() ?? null,
      succeededAt: this._succeededAt?.toISOString() ?? null,
      modifiedAt: this._modifiedAt?.toISOString() ?? null,
      ...this._getAdditionalStatus(),
    };
  }

  private _calculateStatus() {
    if (this._succeededAt == null) {
      return "dead";
    }

    const lifecycles =
      (Date.now() - this._succeededAt.getTime()) / this._pollMillis;

    if (lifecycles > deadAfterLifecycles) {
      return "dead";
    } else if (lifecycles > staleAfterLifecycles) {
      return "stale";
    } else if (this._flakyCountdown > 0) {
      return "flaky";
    } else {
      return "healthy";
    }
  }

  private async _refreshData() {
    try {
      // console.log(`Refreshing ${this._dataName}...`);

      this._attemptedAt = new Date();
      const newHash = await this._downloadData();
      this._succeededAt = new Date();
      if (newHash !== this._hash) {
        this._modifiedAt = new Date();
      }
      this._hash = newHash;

      if (this._flakyCountdown > 0) {
        this._flakyCountdown--;
      }
    } catch (err) {
      console.warn(`Failed to refresh ${this._dataName}. Retaining old data.`);
      console.warn(err);

      this._flakyCountdown = flakyWindow;
    }
  }

  protected abstract _downloadData(): Promise<string>;

  protected abstract _getUrl(): string;

  protected _getAdditionalStatus(): object {
    return {};
  }
}
