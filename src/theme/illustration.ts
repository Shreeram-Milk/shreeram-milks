/**
 * Colours of the small landscape on Home's delivery card, one set per part of the day. They follow real light: a blue sky with
 * a warm horizon in the morning, a clear sky at noon, violet to orange at sunset, deep blue at night. Far hills are paler than
 * near ones, as distance does. Only the illustration uses these; nothing with text sits on them.
 */
export type SceneSky = "morning" | "day" | "evening" | "night";

export interface ScenePalette {
  sky: [string, string, string];
  farHill: string;
  nearHill: string;
  /** Sun core to edge; the moon uses `moon` instead. */
  sun?: [string, string, string];
  glow: string;
  moon?: string;
  /** The little rider and house, readable on that sky. */
  ink: string;
  wall: string;
  roof: string;
  pane: string;
  /** Where the sun or moon rests, in the 60 × 72 scene. */
  orb: { x: number; y: number; r: number };
}

export const scenePalettes: Record<SceneSky, ScenePalette> = {
  morning: {
    sky: ["#79B6E8", "#BCDCF4", "#FFE3C4"], farHill: "#B6D4C3", nearHill: "#86B996",
    sun: ["#FFF8DF", "#FFC54F", "#FF9F2E"], glow: "#FFD48A", ink: "#17130F", wall: "#FFFFFF", roof: "#C93800", pane: "#A9D2F0",
    orb: { x: 38, y: 42, r: 6.5 },
  },
  day: {
    sky: ["#3D96E1", "#8DC7F2", "#DFF1FF"], farHill: "#A7D3B1", nearHill: "#6EAF7E",
    sun: ["#FFFFFF", "#FFF1B3", "#FFD35A"], glow: "#FFF0BF", ink: "#17130F", wall: "#FFFFFF", roof: "#C93800", pane: "#A9D2F0",
    orb: { x: 40, y: 20, r: 6 },
  },
  evening: {
    sky: ["#4A3E86", "#E2735B", "#FFB56F"], farHill: "#9C5C70", nearHill: "#5A3350",
    sun: ["#FFF3D2", "#FFB45E", "#FF7A3D"], glow: "#FFB27A", ink: "#FFF3E3", wall: "#F3D9C8", roof: "#3B1F33", pane: "#FFD27A",
    orb: { x: 36, y: 48, r: 8 },
  },
  night: {
    sky: ["#0A1230", "#1B2752", "#38427A"], farHill: "#222D55", nearHill: "#121A38",
    glow: "#DCE3FF", moon: "#F4EED8", ink: "#FFF3E3", wall: "#2C3766", roof: "#151B3A", pane: "#FFD27A",
    orb: { x: 40, y: 20, r: 6 },
  },
};

/** The orange crate on the rider's scooter: the brand colour. */
export const sceneCrate = "#FF6700";
