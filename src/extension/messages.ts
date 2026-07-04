export type ExtensionSettings = {
  sensitivity: number;
  warningDurationMs: number;
};

export type CalibrationSnapshot = {
  active: boolean;
  step: "good" | "transition" | "bad" | null;
  remainingMs: number;
};

export type MonitoringSnapshot = {
  monitoring: boolean;
  status: "idle" | "starting" | "calibrating" | "watching" | "missing" | "good" | "bad" | "error";
  score: number;
  badDurationMs: number;
  message: string;
  calibration: CalibrationSnapshot;
};

export type PopupToBackgroundMessage =
  | { target: "background"; type: "GET_STATUS" }
  | { target: "background"; type: "START_MONITORING"; settings: ExtensionSettings }
  | { target: "background"; type: "STOP_MONITORING" }
  | { target: "background"; type: "BEGIN_CALIBRATION" }
  | { target: "background"; type: "UPDATE_SETTINGS"; settings: ExtensionSettings };

export type BackgroundToOffscreenMessage =
  | { target: "offscreen"; type: "START_MONITORING"; settings: ExtensionSettings }
  | { target: "offscreen"; type: "STOP_MONITORING" }
  | { target: "offscreen"; type: "BEGIN_CALIBRATION" }
  | { target: "offscreen"; type: "UPDATE_SETTINGS"; settings: ExtensionSettings }
  | { target: "offscreen"; type: "SET_PREVIEW_ACTIVE"; active: boolean };

export type OffscreenToBackgroundMessage =
  | { target: "background"; type: "STATUS_UPDATE"; snapshot: MonitoringSnapshot }
  | { target: "background"; type: "PREVIEW_FRAME"; dataUrl: string }
  | { target: "background"; type: "BAD_POSTURE_ALERT" }
  | { target: "background"; type: "OFFSCREEN_STOPPED" };

export type BackgroundToPopupMessage =
  | { type: "STATUS_UPDATE"; snapshot: MonitoringSnapshot }
  | { type: "PREVIEW_FRAME"; dataUrl: string }
  | { type: "ERROR"; message: string };

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  sensitivity: 0.75,
  warningDurationMs: 3000,
};

export const IDLE_SNAPSHOT: MonitoringSnapshot = {
  monitoring: false,
  status: "idle",
  score: 0,
  badDurationMs: 0,
  message: "停止中です。開始するとカメラで姿勢を見守ります。",
  calibration: {
    active: false,
    step: null,
    remainingMs: 0,
  },
};
