// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class Cache<T extends {}> {
  private readonly _cache: Map<string, { data: T; expiry: Date }>;

  constructor(private readonly _durationMs: number) {
    this._cache = new Map();
  }

  get(key: string): T | null {
    const entry = this._cache.get(key);
    if (entry == null || entry.expiry < new Date()) {
      return null;
    }
    return entry.data;
  }

  save(key: string, data: T) {
    const expiry = new Date(Date.now() + this._durationMs);
    this._cache.set(key, { data, expiry });
    this.clean();
  }

  clean() {
    for (const [key, value] of Array.from(this._cache.entries())) {
      if (value.expiry < new Date()) {
        this._cache.delete(key);
      }
    }
  }
}
