# Delete the old files.
rm -f src/gtfs-realtime/proto.js
rm -f src/gtfs-realtime/proto.d.ts

# Generate src/gtfs-realtime/proto.js.
pbjs -t static-module -o src/gtfs-realtime/proto.js -w es6 src/gtfs-realtime/gtfs-realtime.proto

# Fix the import statement in src/gtfs-realtime/proto.js.
# From: import * as $protobuf from "protobufjs/minimal";
# To: import $protobuf from "protobufjs/minimal";
sed -i 's/import \* as \$protobuf from "protobufjs\/minimal";/import \$protobuf from "protobufjs\/minimal";/' src/gtfs-realtime/proto.js

# Generate src/gtfs-realtime/proto.d.ts, based on the content of src/gtfs-realtime/proto.js.
pbts -o src/gtfs-realtime/proto.d.ts src/gtfs-realtime/proto.js
