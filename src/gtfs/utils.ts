import { exec as execCallback } from "child_process";
import { promisify } from "util";

export const exec = promisify(execCallback);

export async function downloadGtfs() {
  const result = await exec("scripts/download-gtfs.sh");
  console.log("---");
  console.log(result.stdout.trim());
  console.log("---");
}

export async function computeSha256() {
  const result = await exec("sha256sum data/gtfs.zip");
  const hash = result.stdout.trim().split(" ")[0].trim();
  return hash;
}
