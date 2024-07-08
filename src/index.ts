import express from "express";
import { env } from "./env";
import { authMiddleware } from "./auth";
import { GtfsDataService } from "./gtfs";

async function main() {
  // Declare which data services to use.
  const dataServices = {
    gtfs: new GtfsDataService(),
  };

  // Initialize all data services.
  await Promise.all(
    Object.values(dataServices).map((service) => service.init())
  );

  // Create express server to serve gtfs.zip and other static files.
  const app = express();
  const port = env.PORT;

  // Allow anyone to access the public folder (so robots.txt works).
  app.use(express.static("./public"));

  // Requests to the root path will return the status of all data services.
  app.get("/", (req: express.Request, res: express.Response) => {
    res.json({
      status: "ok",

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
