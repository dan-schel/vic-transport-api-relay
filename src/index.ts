import express from "express";
import { env } from "./env";
import { authMiddleware } from "./auth";
import { GtfsDataService } from "./gtfs";
import { GtfsRealtimeDataService } from "./gtfs-realtime";
import { PtvDisruptionsDataService } from "./ptv-disruptions";
import { DataService } from "./service";
import { PtvPlatformsDataService } from "./ptv-platforms";
import { ScsPlatformsDataService } from "./scs-platforms";

async function main() {
  const startTime = new Date();

  // Declare which data services to use.
  const dataServices: Record<string, DataService> = {};
  if (env.GTFS_ENABLED) {
    dataServices["gtfs"] = new GtfsDataService();
  }
  if (env.GTFS_REALTIME_ENABLED) {
    dataServices["gtfsRealtime"] = new GtfsRealtimeDataService();
  }
  if (env.PTV_DISRUPTIONS_ENABLED) {
    dataServices["ptvDisruptions"] = new PtvDisruptionsDataService();
  }
  if (env.PTV_PLATFORMS_ENABLED) {
    dataServices["ptvPlatforms"] = new PtvPlatformsDataService();
  }
  if (env.SCS_PLATFORMS_ENABLED) {
    dataServices["scsPlatforms"] = new ScsPlatformsDataService();
  }

  // Initialize all data services.
  await Promise.all(
    Object.values(dataServices).map((service) => service.init())
  );

  // Create express server to serve gtfs.zip and other static files.
  const app = express();
  const port = env.PORT;

  // Allow anyone to access the public folder (so robots.txt works).
  app.use(express.static("./public"));

  // Requests to "/status.json" will return the status of all data services.
  // This is used by index.html, and could also be useful for TrainQuery to
  // check for data updates.
  app.get("/status.json", (req: express.Request, res: express.Response) => {
    res.json({
      requiresRelayKey: env.RELAY_KEY != null,
      startTime: startTime.toISOString(),
      ...Object.entries(dataServices)
        .map(([key, value]) => ({ [key]: value.getStatus() }))
        .reduce((acc, val) => ({ ...acc, ...val }), {}),
    });
  });

  // Block access to the data folder unless the request is authorized.
  app.use(authMiddleware, express.static("./data"));

  // Start listening on the specified port and run onListening for each data
  // service.
  app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
  });
  Object.values(dataServices).forEach((service) => service.onListening());
}

main();
