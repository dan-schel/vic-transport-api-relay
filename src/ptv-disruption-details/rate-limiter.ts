export class RateLimiter {
  private readonly _occurances: Date[];

  constructor(
    readonly windowSize: number,
    private readonly _windowMs: number,
  ) {
    this._occurances = [];
  }

  getCounterValue() {
    this.clean();
    return this._occurances.length;
  }

  activated() {
    return this.getCounterValue() >= this.windowSize;
  }

  logOccurance() {
    this._occurances.push(new Date());
    this.clean();
  }

  clean() {
    const startOfWindow = new Date(Date.now() - this._windowMs);
    while (this._occurances.length > 0 && this._occurances[0] < startOfWindow) {
      this._occurances.shift();
    }
  }
}
