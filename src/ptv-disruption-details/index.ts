import { DataService } from "../service";
import express from "express";
import { fetchDetails, FetchDetailsResult } from "./fetch-details";
import { env } from "../env";
import { Cache } from "./cache";
import { RateLimiter } from "./rate-limiter";

// Store stats on the last 100 fetches.
const fetchResultsCount = 100;

const ptvDisruptionDetailsUrl =
  "https://ptv.vic.gov.au/live-travel-updates/article/";

export type ErrorType =
  | "invalid-request"
  | "unknown-error"
  | "not-found"
  | "unsupported-url"
  | "rate-limited";

export type Result = { details: string } | { error: ErrorType };

export class PtvDisruptionDetailsDataService extends DataService {
  private readonly _cache = new Cache<Result>(
    env.PTV_DISRUPTION_DETAILS_CACHE_MINUTES * 60 * 1000
  );

  private readonly _rateLimiter = new RateLimiter(
    env.PTV_DISRUPTION_DETAILS_LIMIT_COUNT,
    env.PTV_DISRUPTION_DETAILS_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  private readonly _fetchResults: FetchDetailsResult[] = [];
  private _lastFetch: Date | null = null;
  private _lastError: Date | null = null;

  // Do nothing until a request is made.
  override async init(): Promise<void> {}
  override onListening(): void {}

  override getStatus(): object {
    const rateLimitActivated = this._rateLimiter.activated()
      ? "Activated"
      : "Not activated";
    const realCount = this._rateLimiter.getCounterValue();
    const windowCount = this._rateLimiter.windowSize;
    const attempts = this._fetchResults.length;
    const errors = this._countSuccessfulResults() - attempts;

    return {
      status: this._getOverallStatus(),
      lastFetch: this._lastFetch,
      lastError: this._lastError,
      rateLimiter: `${rateLimitActivated} (${realCount} of ${windowCount})`,
      errorRate: `${errors} of the last ${attempts} attempt(s)`,
    };
  }

  async onRequest(req: express.Request): Promise<Result> {
    const url = req.query.url;
    if (typeof url !== "string") {
      return { error: "invalid-request" };
    }

    if (!url.startsWith(ptvDisruptionDetailsUrl)) {
      return { error: "unsupported-url" };
    }

    const cached = this._cache.get(url);
    if (cached != null) return cached;

    if (this._rateLimiter.activated()) {
      return { error: "rate-limited" };
    }

    return this._fetch(url);
  }

  private async _fetch(url: string) {
    this._rateLimiter.logOccurance();
    this._lastFetch = new Date();

    const fetchResult = await fetchDetails(url);
    this._logFetchDetailsResult(url, fetchResult);

    const result = this._fetchResultToResult(fetchResult);

    if (!("error" in fetchResult) || fetchResult.error !== "fetch-failed") {
      this._cache.save(url, result);
    }

    return result;
  }

  private _logFetchDetailsResult(url: string, result: FetchDetailsResult) {
    this._fetchResults.push(result);
    while (this._fetchResults.length > fetchResultsCount) {
      this._fetchResults.shift();
    }

    if (!("error" in result) || result.error === "not-found") return;

    this._lastError = new Date();
    console.warn(`Failed to fetch disruption details for "${url}".`);

    if (result.error === "parsing-error") {
      console.warn(result.parsingError);
    } else if (result.error === "fetch-failed") {
      console.warn("The request failed/returned malformed HTML.");
    }
  }

  private _fetchResultToResult(result: FetchDetailsResult): Result {
    if ("details" in result) return { details: result.details };
    if (result.error === "not-found") return { error: "not-found" };
    return { error: "unknown-error" };
  }

  private _countSuccessfulResults() {
    return this._fetchResults.filter(
      (r) => "details" in r || r.error === "not-found"
    ).length;
  }

  private _getOverallStatus() {
    if (this._fetchResults.length === 0) return "unused";

    const successfulResults = this._countSuccessfulResults();

    if (successfulResults === 0) return "dead";
    if (successfulResults < this._fetchResults.length) return "someErrors";
    if (this._rateLimiter.activated()) return "rateLimited";

    return "healthy";
  }
}
