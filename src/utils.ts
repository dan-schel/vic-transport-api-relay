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
