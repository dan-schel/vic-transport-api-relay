import crypto from "crypto";

export function sha256Hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
