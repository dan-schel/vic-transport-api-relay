import { itsOk, unique } from "@dan-schel/js-utils";
import { parse } from "node-html-parser";
import { DateTime } from "luxon";
import { cleanString, KnownPlatform } from "../utils";

const vlineUrl = "https://www.vline.com.au/scs-departures";

const firstServicesQuery = ".first-service";
const firstServicesRegex =
  /^[a-z ]+ ([0-9]+:[0-9]{2}) towards ([a-z ]+) platform ([a-z0-9]+)/i;

const nextServicesQuery = ".next-services > :not(.hide)";
const nextServicesRegex =
  /^([0-9]+:[0-9]{2}) ([a-z ]+) ([a-z0-9]+) [0-9]+ [hm]/i;

export async function fetchFromVline(): Promise<KnownPlatform[]> {
  const response = await fetch(vlineUrl);
  const htmlStr = await response.text();
  const html = parse(htmlStr);

  const firstServices = html
    .querySelectorAll(firstServicesQuery)
    .map((x) => cleanString(x.innerText));
  if (firstServices.length == 0) {
    throw new Error(`Nothing matches "${firstServices}" query.`);
  }

  const nextServices = html
    .querySelectorAll(nextServicesQuery)
    .map((x) => cleanString(x.innerText));
  if (nextServices.length == 0) {
    throw new Error(`Nothing matches "${nextServicesQuery}" query.`);
  }

  const rawResult: {
    timeStr: string;
    terminusName: string;
    platformStr: string;
  }[] = [];

  for (const serviceStr of firstServices) {
    const match = firstServicesRegex.exec(serviceStr);
    if (match == null) {
      continue;
    }

    const [, timeStr, terminusName, platformStr] = match;
    rawResult.push({ timeStr, terminusName, platformStr });
  }

  for (const serviceStr of nextServices) {
    const match = nextServicesRegex.exec(serviceStr);
    if (match == null) {
      continue;
    }

    const [, timeStr, terminusName, platformStr] = match;
    rawResult.push({ timeStr, terminusName, platformStr });
  }

  const uniqueResult = unique(
    rawResult,
    (a, b) => a.timeStr === b.timeStr && a.terminusName === b.terminusName
  );

  const result: KnownPlatform[] = uniqueResult.map((x) => ({
    terminus: null,
    terminusName: x.terminusName,
    scheduledDepartureTime: guessFullDateTime(x.timeStr),
    platform: processPlatformStr(x.platformStr),
  }));

  return result;
}

function guessFullDateTime(timeStr: string): Date {
  const possibleDates = [-2, -1, 0, 1, 2].map((x) => {
    const date = DateTime.now().toUTC().plus({ days: x }).toISODate();
    return DateTime.fromISO(`${date}T${timeStr}:00`, {
      zone: "Australia/Melbourne",
    }).toJSDate();
  });

  const now = Date.now();
  const sixHours = 6 * 60 * 60 * 1000;
  const eighteenHours = 18 * 60 * 60 * 1000;

  const bestGuess = possibleDates.find(
    (x) => x.getTime() > now - sixHours && x.getTime() <= now + eighteenHours
  );

  return itsOk(bestGuess);
}

function processPlatformStr(platformStr: string): string {
  const id = platformStr.toLowerCase();

  // If no A/B is provided, assume A?? (Except platform 1.)
  if (id != "1" && /^[0-9]+$/g.test(id)) {
    return `${id}a`;
  }

  return id;
}
