import { exec as execCallback } from "child_process";
import { promisify } from "util";

const exec = promisify(execCallback);

export async function downloadGtfs() {
  const result = await exec("scripts/download-gtfs.sh");
  console.log("---");
  console.log(result.stdout.trim());
  console.log("---");
}
