export type Override = { final_stop_id: number; destination_name: string };

type OverrideList = Record<number, Record<number, Record<number, Override>>>;

const parliamentToFlindersStreet = {
  1: {
    1155: {
      final_stop_id: 1071,
      destination_name: "Flinders Street",
    },
  },
};
const crossCityGroup = {
  1: {
    1181: {
      final_stop_id: 1071,
      destination_name: "Flinders Street",
    },
  },
};
const northernGroup = {
  1: {
    // Flagstaff
    1068: {
      final_stop_id: 1071,
      destination_name: "Flinders Street",
    },
    // Southern Cross
    1181: {
      final_stop_id: 1071,
      destination_name: "Flinders Street",
    },

    // We need something like this for departures from Southern Cross, going via
    // Flinders Street and the City Loop, but unfortunately it looks like the
    // direction_id is not 1 in that case.
    //
    // // Craigieburn
    // 1044: {
    //   final_stop_id: 1071,
    //   destination_name: "Flinders Street",
    // },
    // // Sunbury
    // 1187: {
    //   final_stop_id: 1071,
    //   destination_name: "Flinders Street",
    // },
    // // Upfield
    // 1198: {
    //   final_stop_id: 1071,
    //   destination_name: "Flinders Street",
    // },
  },
};

const overrides: OverrideList = {
  1: parliamentToFlindersStreet, // Alamein Line
  2: parliamentToFlindersStreet, // Belgrave Line
  3: northernGroup, // Craigieburn Line
  4: {}, // Cranbourne Line
  5: parliamentToFlindersStreet, // Mernda Line
  6: crossCityGroup, // Frankston Line
  7: parliamentToFlindersStreet, // Glen Waverley Line
  8: parliamentToFlindersStreet, // Hurstbridge Line
  9: parliamentToFlindersStreet, // Lilydale Line
  11: {}, // Pakenham Line
  12: crossCityGroup, // Sandringham Line
  13: {}, // Stony Point Line
  14: northernGroup, // Sunbury Line
  15: northernGroup, // Upfield Line
  16: {}, // Werribee Line
  17: {}, // Williamstown Line
};

export function getOverrideFor(
  routeID: number,
  directionID: number,
  finalStopID: number,
): Override | null {
  return overrides[routeID]?.[directionID]?.[finalStopID] ?? null;
}
