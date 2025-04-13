import { DataService } from "../service";
import express from "express";
import { fetchDetails } from "./fetch-details";
import { env } from "../env";

type Response = {
  details: string | null;
  stats: ResponseStats;
};

type ResponseStats = {
  time: Date;
  outcome: "cache-miss" | "cache-hit" | "error" | "rate-limited";
};

type CachedResponse = {
  url: string;
  details: string;
  expiry: Date;
};

// Store stats on the last 100 requests.
const responseStatsCount = 100;

export class PtvDisruptionDetailsDataService extends DataService {
  private readonly _cachedResponses: CachedResponse[] = [];
  private readonly _realRequestTimes: Date[] = [];
  private readonly _responseStats: ResponseStats[] = [];

  // Do nothing until a request is made.
  override async init(): Promise<void> {}
  override onListening(): void {}

  override getStatus(): object {
    const rateLimitActivated = this._isRateLimited() ? "Activated" : "OK";
    const windowCount = env.PTV_DISRUPTION_DETAILS_LIMIT_COUNT;
    const realCount = this._rateLimitCounterValue();

    const attempts = this._responseStats.filter(
      (x) => x.outcome === "error" || x.outcome === "cache-miss"
    ).length;
    const errors = this._responseStats.filter(
      (x) => x.outcome === "error"
    ).length;
    const lastError = this._responseStats
      .filter((x) => x.outcome === "error")
      .at(-1)?.time;

    return {
      status: this._getOverallStatus(),
      lastRealFetch: this._realRequestTimes.at(-1)?.toISOString() ?? null,
      lastError: lastError ?? null,
      rateLimiter: `${rateLimitActivated} (${realCount} of ${windowCount})`,
      errorRate: `${errors} of the last ${attempts} attempt(s)`,
    };
  }

  async onRequest(req: express.Request): Promise<object | null> {
    const url = req.query.url;
    if (typeof url !== "string") {
      return null;
    }

    const response = await this._respondTo(url);
    this._logResponse(response.stats);

    if (response.details == null) {
      return null;
    }

    return { details: response.details };
  }

  private async _respondTo(url: string): Promise<Response> {
    // First, check the cache.
    const cache = this._findCachedResponse(url);
    if (cache != null) {
      return {
        details: cache,
        stats: { time: new Date(), outcome: "cache-hit" },
      };
    }

    // Next, ensure we're not being too spammy.
    if (this._isRateLimited()) {
      return {
        details: null,
        stats: { time: new Date(), outcome: "rate-limited" },
      };
    }

    try {
      // Then, attempt to fetch the details.
      this._logRealRequest();
      const details = await fetchDetails(url);
      this._cacheResponse(url, details);
      return {
        details,
        stats: { time: new Date(), outcome: "cache-miss" },
      };
    } catch (err) {
      // If it fails, log the error.
      console.warn(`Failed to fetch disruption details for ${url}.`);
      console.warn(err);
      return {
        details: null,
        stats: { time: new Date(), outcome: "error" },
      };
    }
  }

  private _findCachedResponse(url: string): string | null {
    const cached = this._cachedResponses.find(
      (res) => res.url === url && res.expiry > new Date()
    );
    return cached?.details ?? null;
  }

  private _isRateLimited(): boolean {
    return (
      this._rateLimitCounterValue() >= env.PTV_DISRUPTION_DETAILS_LIMIT_COUNT
    );
  }

  private _rateLimitCounterValue(): number {
    const limitWindowMs =
      env.PTV_DISRUPTION_DETAILS_LIMIT_WINDOW_MINUTES * 60 * 1000;
    const startOfLimitWindow = new Date(Date.now() - limitWindowMs);
    return this._realRequestTimes.filter((time) => time > startOfLimitWindow)
      .length;
  }

  private _getOverallStatus() {
    if (this._responseStats.length === 0) {
      return "unused";
    } else if (this._responseStats.every((x) => x.outcome === "error")) {
      return "dead";
    } else if (this._responseStats.some((x) => x.outcome === "error")) {
      return "someErrors";
    } else if (this._isRateLimited()) {
      return "rateLimited";
    } else {
      return "healthy";
    }
  }

  private _cacheResponse(url: string, details: string) {
    const cacheMs = env.PTV_DISRUPTION_DETAILS_CACHE_MINUTES * 60 * 1000;
    const expiry = new Date(Date.now() + cacheMs);
    this._cachedResponses.push({ url, details, expiry });

    // Cleanup expired cached responses.
    while (
      this._cachedResponses.length != 0 &&
      this._cachedResponses[0].expiry <= new Date()
    ) {
      this._cachedResponses.shift();
    }
  }

  private _logRealRequest() {
    this._realRequestTimes.push(new Date());

    while (
      this._realRequestTimes.length > env.PTV_DISRUPTION_DETAILS_LIMIT_COUNT
    ) {
      this._realRequestTimes.shift();
    }
  }

  private _logResponse(stats: ResponseStats) {
    this._responseStats.push(stats);

    // Cleanup old stats.
    while (this._responseStats.length > responseStatsCount) {
      this._responseStats.shift();
    }
  }
}
