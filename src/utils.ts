import crypto from "crypto";
import fsp from "fs/promises";

export function sha256Hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function prepareDataFolder(): Promise<void> {
  try {
    await fsp.access("./data");
  } catch {
    await fsp.mkdir("./data");
  }
}

export type KnownPlatform = {
  terminus: number | null;
  terminusName: string;
  scheduledDepartureTime: Date;
  platform: string;
};

export function cleanString(input: string) {
  return input.trim().replace(/\s+/g, " ");
}
