import express from "express";
import { env } from "./env";
import { downloadGtfs } from "./download-gtfs";

// Refresh the gtfs.zip every 12 hours.
const refreshInterval = 1000 * 60 * 60 * 12;

async function main() {
  console.log(`Downloading initial gtfs.zip...`);
  await downloadGtfs();
  let gtfsAge = new Date();

  // Create express server to serve gtfs.zip and other static files.
  const app = express();
  const port = env.PORT;
  app.use(express.static("./public"));
  app.use(express.static("./data"));

  app.get("/", (req, res) => {
    res.json({
      status: "ok",
      gtfs: {
        age: gtfsAge.toISOString(),
      },
    });
  });
  app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
  });

  // Periodically refresh gtfs.zip.
  setTimeout(() => {
    console.log(`Refreshing gtfs.zip...`);
    downloadGtfs()
      .then(() => {
        gtfsAge = new Date();
      })
      .catch((err) => {
        console.warn("Failed to refresh gtfs.zip. Retaining old data.");
        console.warn(err);
      });
  }, refreshInterval);
}

main();
