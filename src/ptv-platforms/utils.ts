export type KnownPlatform = {
  terminus: number | null;
  terminusName: string;
  scheduledDepartureTime: Date;
  platform: string;
};

export function cleanString(input: string) {
  return input.trim().replace(/\s+/g, " ");
}
