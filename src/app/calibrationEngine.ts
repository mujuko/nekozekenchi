import { average, type PostureState } from "../posture";

const CALIBRATION_SAMPLE_MS = 3000;
const CALIBRATION_TRANSITION_MS = 2500;

type CalibrationStep = "good" | "transition" | "bad";

export type CalibrationSnapshot = {
  active: boolean;
  step: CalibrationStep | null;
  remainingMs: number;
};

export type CalibrationSampleResult = {
  calibratedState: PostureState | null;
  snapshot: CalibrationSnapshot;
};

export function createCalibrationEngine() {
  let active = false;
  let step: CalibrationStep | null = null;
  let startedAt = 0;
  let samples: number[] = [];
  let calibratedGoodY: number | null = null;

  function begin(now = performance.now()) {
    active = true;
    step = "good";
    startedAt = now;
    samples = [];
    calibratedGoodY = null;
  }

  function reset() {
    active = false;
    step = null;
    startedAt = 0;
    samples = [];
    calibratedGoodY = null;
  }

  function handleSample(noseY: number, now: number): CalibrationSampleResult {
    if (!active || step === null) {
      return { calibratedState: null, snapshot: getSnapshot(now) };
    }

    const elapsed = now - startedAt;

    if (step === "transition") {
      if (elapsed >= CALIBRATION_TRANSITION_MS) {
        step = "bad";
        startedAt = now;
        samples = [];
      }

      return { calibratedState: null, snapshot: getSnapshot(now) };
    }

    samples.push(noseY);

    if (elapsed < CALIBRATION_SAMPLE_MS) {
      return { calibratedState: null, snapshot: getSnapshot(now) };
    }

    const averageY = average(samples);
    if (averageY === null) {
      return { calibratedState: null, snapshot: getSnapshot(now) };
    }

    if (step === "good") {
      calibratedGoodY = averageY;
      step = "transition";
      startedAt = now;
      samples = [];
      return { calibratedState: null, snapshot: getSnapshot(now) };
    }

    if (step === "bad" && calibratedGoodY !== null) {
      const calibratedState: PostureState = {
        goodY: calibratedGoodY,
        badY: averageY,
        badSince: null,
        lastAlertAt: null,
      };
      reset();
      return { calibratedState, snapshot: getSnapshot(now) };
    }

    return { calibratedState: null, snapshot: getSnapshot(now) };
  }

  function getSnapshot(now = performance.now()): CalibrationSnapshot {
    if (!active || step === null) {
      return { active: false, step: null, remainingMs: 0 };
    }

    const duration = step === "transition"
      ? CALIBRATION_TRANSITION_MS
      : CALIBRATION_SAMPLE_MS;
    const remainingMs = Math.max(0, duration - (now - startedAt));

    return { active, step, remainingMs };
  }

  function isActive() {
    return active;
  }

  return {
    begin,
    getSnapshot,
    handleSample,
    isActive,
    reset,
  };
}

export type CalibrationEngine = ReturnType<typeof createCalibrationEngine>;
