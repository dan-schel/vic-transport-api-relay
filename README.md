# Vic Transport API Relay

Interfaces with Victorian transport APIs for [TrainQuery](https://github.com/dan-schel/trainquery).

The server periodically downloads [GTFS data from Victoria's Department of Transport and Planning](https://opendata.transport.vic.gov.au/dataset/gtfs-schedule), strips out the files that aren't needed by TrainQuery (e.g. bus timetables, geographic data), and makes the optimized zip file available for download at `/gtfs.zip`.

It also makes [GTFS realtime data](https://opendata.transport.vic.gov.au/dataset/gtfs-realtime) available at `/gtfs-realtime.json`, disruptions from the [PTV API](https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api/) available at `/ptv-disruptions.json`, and platform information from a combination of sources available at `/ptv-platforms.json` and `/scs-platforms.json`. Further disruption details can be requested on-demand using the `/ptv-disruption-details` endpoint.

**Note:** Assumes a Linux/MacOS running environment (i.e. the system must be able to execute a bash script, with tools such as `awk`, `curl`, `sha256sum`, `zip`, etc. available).

## Getting started

1. Clone the repo.
2. Run `npm i` to install dependencies.
3. Create a `.env` file, as described below:

```dotenv
# All values provided below are examples. Customize the values for your needs.

# The URL of the server (default: http://localhost:3000).
URL = "https://vtar.trainquery.com"

# The port to run the server on (default: 3000).
PORT = 3000

# Flag for Node to know when it's running in production (default: development).
NODE_ENV = "production"

# Must be set to "false" to install devDependencies in Digital Ocean. Not
# required in dev (optional).
NPM_CONFIG_PRODUCTION = "false"

# If provided, clients must pass a "relay-key" header with this value to
# download the available data (optional).
RELAY_KEY = "..."

# The connection string to a MongoDB server, which if provided, is used to
# persist statistics across restarts (optional).
# e.g. "mongodb://username:password@localhost:27017/?authMechanism=DEFAULT"
DATABASE_URL = "..."

# How often, in hours, to re-download gtfs.zip (default: every 6 hours).
GTFS_REFRESH_HOURS = 6

# How often, in seconds, to re-fetch GTFS realtime data (default: every 20
# seconds).
GTFS_REALTIME_REFRESH_SECONDS = 20

# How often, in minutes, to re-fetch disruptions from the PTV API (default:
# every 5 minutes).
PTV_DISRUPTIONS_REFRESH_MINUTES = 5

# The window size, in minutes, that is considered when deciding when to rate
# limit ourselves making further requests to PTV (default: 60 minutes). During
# rate-limiting, the server will still happily return cached responses, it just
# won't make any new fetches.
PTV_DISRUPTION_DETAILS_LIMIT_WINDOW_MINUTES = 60

# How many requests must be made within the window before further requests are
# refused (default: 10 requests).
PTV_DISRUPTION_DETAILS_LIMIT_COUNT = 10

# How long, in minutes, to cache the disruption details fetched from the PTV
# website (default: 120 minutes).
PTV_DISRUPTION_DETAILS_CACHE_MINUTES = 120

# How often, in seconds, to send a platform request to the PTV API when initial
# platform data is being populated (default: every 10 seconds).
PTV_PLATFORMS_INITIAL_FETCH_SECONDS = 10

# How often, in seconds, to send a platform request to the PTV API once an
# attempt has been made for every stop needing platform data (default: every 120
# seconds).
PTV_PLATFORMS_REGULAR_FETCH_SECONDS = 120

# How often, in minutes, to re-fetch platform data from the V/Line website
# (default: every 10 minutes).
SCS_PLATFORMS_REFRESH_MINUTES = 10

# How often, in minutes, to re-fetch stops from the PTV API (default: every 60
# minutes).
PTV_STOPS_REFRESH_MINUTES = 60

# The developer ID used to authenticate to the PTV API (required).
PTV_DEV_ID = "..."

# The developer key used to authenticate to the PTV API (required).
PTV_DEV_KEY = "..."

# The API key for the GTFS realtime API (required).
GTFS_REALTIME_KEY = "..."

# Can be set to false to disable GTFS polling (default: true).
GTFS_ENABLED = true

# Can be set to false to disable GTFS realtime polling (default: true).
# GTFS_REALTIME_KEY must still be provided regardless of this value.
GTFS_REALTIME_ENABLED = true

# Can be set to false to disable PTV Disruptions polling (default: true).
# PTV_DEV_ID and PTV_DEV_KEY must still be provided regardless of this value.
PTV_DISRUPTIONS_ENABLED = true

# Can be set to false to disable PTV Platforms polling (default: true).
# PTV_DEV_ID and PTV_DEV_KEY must still be provided regardless of this value.
PTV_PLATFORMS_ENABLED = true

# Can be set to false to disable SCS Platforms scraping (default: true).
SCS_PLATFORMS_ENABLED = true

# Can be set to false to disable PTV disruption details scraping (default:
# true).
PTV_DISRUPTION_DETAILS_ENABLED = true

# Can be set to false to disable PTV Stops polling (default: true).
# PTV_DEV_ID and PTV_DEV_KEY must still be provided regardless of this value.
PTV_STOPS_ENABLED = true
```

4. Run `npm start` to start the server.
