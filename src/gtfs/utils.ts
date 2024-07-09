import { exec as execCallback } from "child_process";
import { promisify } from "util";

export const exec = promisify(execCallback);

export async function downloadGtfs() {
  const result = await exec("scripts/download-gtfs.sh");
  console.log("---");
  console.log(result.stdout.trim());
  console.log("---");

  const line = result.stdout
    .split("\n")
    .find((line) => line.startsWith("The hash is:"));

  if (line == null) {
    throw new Error("Hash not given in download-gtfs.sh output.");
  }

  const hash = line.replace("The hash is: ", "").trim();
  return hash;
}
