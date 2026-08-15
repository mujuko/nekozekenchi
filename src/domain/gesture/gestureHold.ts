import type { GestureCommand } from "./types";

export type GestureHoldResult = {
  candidate: GestureCommand | null;
  progress: number;
  started: boolean;
  triggered: GestureCommand | null;
};

const HOLD_DURATION_MS: Record<GestureCommand, number> = {
  pause: 1000,
  resume: 1000,
  stop: 1500,
  recalibrate: 1000,
  mute: 800,
  unmute: 800,
};

const DETECTION_GRACE_MS = 250;
const RELEASE_DURATION_MS = 600;

export function createGestureHoldController() {
  let candidate: GestureCommand | null = null;
  let candidateSince = 0;
  let lastSeenAt = 0;
  let armed = true;
  let neutralSince: number | null = null;

  function update(
    observed: GestureCommand | null,
    now: number,
  ): GestureHoldResult {
    if (!armed) {
      if (observed === null) {
        neutralSince ??= now;
        if (now - neutralSince >= RELEASE_DURATION_MS) {
          armed = true;
          neutralSince = null;
        }
      } else {
        neutralSince = null;
      }
      return emptyResult();
    }

    if (observed !== null) {
      let started = false;
      if (candidate !== observed) {
        candidate = observed;
        candidateSince = now;
        started = true;
      }
      lastSeenAt = now;

      const progress = Math.min(
        1,
        (now - candidateSince) / HOLD_DURATION_MS[observed],
      );
      if (progress >= 1) {
        const triggered = observed;
        armed = false;
        candidate = null;
        neutralSince = null;
        return { candidate: triggered, progress: 1, started: false, triggered };
      }

      return { candidate: observed, progress, started, triggered: null };
    }

    if (candidate && now - lastSeenAt <= DETECTION_GRACE_MS) {
      return {
        candidate,
        progress: Math.min(
          1,
          (lastSeenAt - candidateSince) / HOLD_DURATION_MS[candidate],
        ),
        started: false,
        triggered: null,
      };
    }

    candidate = null;
    return emptyResult();
  }

  function reset() {
    candidate = null;
    candidateSince = 0;
    lastSeenAt = 0;
    armed = true;
    neutralSince = null;
  }

  return { reset, update };
}

function emptyResult(): GestureHoldResult {
  return { candidate: null, progress: 0, started: false, triggered: null };
}
