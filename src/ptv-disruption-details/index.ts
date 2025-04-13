import { DataService, PollingDataService } from "../service";
import express from "express";
import { fetchDetails } from "./fetch-details";
import { env } from "../env";
import { removeIf } from "@dan-schel/js-utils";

type Response = {
  details: string | null;
  stats: ResponseStats;
};

type ResponseStats = {
  date: Date;
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
  private readonly _responseStats: ResponseStats[] = [];
  private readonly _cachedResponses: CachedResponse[] = [];

  // Do nothing until a request is made.
  override async init(): Promise<void> {}
  override onListening(): void {}

  override getStatus(): object {
    throw new Error("Method not implemented.");
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
        stats: { date: new Date(), outcome: "cache-hit" },
      };
    }

    // Next, ensure we're not being too spammy.
    if (this._isRateLimited()) {
      return {
        details: null,
        stats: { date: new Date(), outcome: "rate-limited" },
      };
    }

    try {
      // Then, attempt to fetch the details.
      const details = await fetchDetails(url);
      this._cacheResponse(url, details);
      return {
        details,
        stats: { date: new Date(), outcome: "cache-miss" },
      };
    } catch (err) {
      // If it fails, log the error.
      console.warn(`Failed to fetch disruption details for ${url}.`);
      console.warn(err);
      return {
        details: null,
        stats: { date: new Date(), outcome: "error" },
      };
    }
  }

  private _findCachedResponse(url: string): string | null {
    const cached = this._cachedResponses.find(
      (res) => res.url === url && res.expiry > new Date()
    );
    return cached?.details ?? null;
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

  private _isRateLimited(): boolean {
    const startOfLimitWindow = new Date(
      Date.now() - env.PTV_DISRUPTION_DETAILS_LIMIT_WINDOW_MINUTES * 60 * 1000
    );

    const recentRealRequests = this._responseStats.filter(
      (stat) => stat.date > startOfLimitWindow && stat.outcome === "cache-miss"
    );

    return recentRealRequests.length >= env.PTV_DISRUPTION_DETAILS_LIMIT_COUNT;
  }

  private _logResponse(stats: ResponseStats) {
    this._responseStats.push(stats);

    // Cleanup old stats.
    while (this._responseStats.length > responseStatsCount) {
      this._responseStats.shift();
    }
  }
}
