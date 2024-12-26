import { Db, MongoClient } from "mongodb";
import { z } from "zod";

const startsSchema = z.object({
  startTime: z.date(),
});

export class Database {
  private readonly _db: Db | null;

  constructor(private _client: MongoClient | null) {
    this._db = _client?.db("vtar") ?? null;
  }

  static async init(connectionString: string | null): Promise<Database> {
    if (!connectionString) {
      return new Database(null);
    }

    const client = new MongoClient(connectionString);
    await client.connect();
    return new Database(client);
  }

  async fetchRecentStartTimes(limit: number): Promise<Date[]> {
    if (!this._db) {
      return [];
    }

    const rawStarts = await this._db
      .collection("starts")
      .find()
      .sort({ startTime: -1 })
      .limit(limit)
      .toArray();

    const starts = startsSchema.array().parse(rawStarts);

    return starts.map((start) => start.startTime);
  }

  async recordStartTime(startTime: Date): Promise<void> {
    if (!this._db) {
      return;
    }

    await this._db.collection("starts").insertOne({ startTime });
  }
}
