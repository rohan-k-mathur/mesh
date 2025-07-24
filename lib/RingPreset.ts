export type RingPreset =
  | "GRID_12"
  | "STAIR_9876"
  | "HYBRID_10_5";

export interface PresetInfo {
  name: string;
  rings: readonly number[];
  radii: readonly number[];
}

export const PRESETS: Record<RingPreset, PresetInfo> = {
  GRID_12: {
    name: "12-12-12-12",
    rings: [12, 12, 12, 12],
    radii: [140, 108, 78, 52],
  },
  STAIR_9876: {
    name: "9-8-7-6",
    rings: [9, 8, 7, 6],
    radii: [140, 108, 78, 52],
  },
  HYBRID_10_5: {
    name: "10-10-5-5",
    rings: [10, 10, 5, 5],
    radii: [140, 108, 78, 52],
  },
};
