export type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type DetectedHand = {
  landmarks: Landmark[];
  categoryName: string;
  score: number;
};

export type GestureCommand =
  | "pause"
  | "resume"
  | "stop"
  | "recalibrate"
  | "mute"
  | "unmute";
