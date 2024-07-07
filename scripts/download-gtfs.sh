#!/bin/bash

# Usage: scripts/download-gtfs.sh
#
# This script downloads the GTFS data from the DTP's website, strips out the
# unnecessary files to dramatically reduce the download size for TrainQuery, and
# saves the result to `public/gtfs.zip`.

set -euo pipefail
gtfs_url="https://data.ptv.vic.gov.au/downloads/gtfs.zip"
destination="data/gtfs.zip"

temp_folder=".temp-$(uuidgen)"
mkdir $temp_folder

echo "Downloading \"$gtfs_url\"..."
curl --progress-bar -o "$temp_folder/gtfs.zip" "$gtfs_url"

echo "Extracting \"$temp_folder/gtfs.zip\"..."
unzip -q $temp_folder/gtfs.zip -d $temp_folder

echo "Extracting subfeeds..."
mkdir $temp_folder/regional
mkdir $temp_folder/suburban
unzip -q $temp_folder/1/google_transit.zip -d $temp_folder/regional
unzip -q $temp_folder/2/google_transit.zip -d $temp_folder/suburban

echo "Create \"$temp_folder/regional.zip\"..."
(
  cd $temp_folder/regional
  zip -q -r ../regional.zip \
    calendar.txt \
    calendar_dates.txt \
    stop_times.txt \
    trips.txt
)

echo "Create \"$temp_folder/suburban.zip\"..."
(
  cd $temp_folder/suburban
  zip -q -r ../suburban.zip \
    calendar.txt \
    calendar_dates.txt \
    stop_times.txt \
    trips.txt
)

echo "Create \"$destination\"..."
rm -f $destination
(
  cd $temp_folder
  zip -q -r ../$destination \
    suburban.zip \
    regional.zip
)

echo "Cleaning up \"$temp_folder\"..."
rm -rf $temp_folder

echo "✅ All done!"
