# Vic Transport API Relay

Interfaces with Victorian transport APIs for [TrainQuery](https://github.com/dan-schel/trainquery).

Periodically downloads [GTFS data from Victoria's Department of Transport and Planning](https://discover.data.vic.gov.au/dataset/timetable-and-geographic-information-gtfs), strips out the files that aren't needed by TrainQuery (e.g. bus timetables, geographic data), and makes the optimized zip file available for download at `/gtfs.zip`.

**Note:** Assumes a Linux/MacOS running environment (i.e. the system must be able to execute a bash script, with tools such as `awk`, `curl`, `sha256sum`, `zip`, etc. available).

## Getting started

1. Clone the repo.
2. Run `npm i` to install dependencies.
3. Create a `.env` file, as described below:

```dotenv
# All values provided below are examples. Customize the values for your needs.

# The port to run the server on (default: 3000).
PORT = 3000

# Flag for Node to know when it's running in production (default: development).
NODE_ENV = "production"

# If provided, clients must pass a "vtar-key" header with this value to download
# the available data (optional).
VTAR_KEY = "..."

# How often, in hours, to re-download gtfs.zip (default: every 6 hours).
GTFS_REFRESH_HOURS = 6
```

4. Run `npm start` to start the server.
