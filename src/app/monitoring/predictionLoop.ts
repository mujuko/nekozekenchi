import type { InferenceResult } from "../../platform/pose/poseProtocol";
import type { PoseInferenceClient } from "../../platform/pose/poseClient";

const BACKGROUND_PREDICTION_INTERVAL_MS = 125;
const GESTURE_PREDICTION_INTERVAL_MS = 125;

type PredictionLoopOptions = {
  video: HTMLVideoElement;
  getClient(): PoseInferenceClient | null;
  isActive(): boolean;
  isPaused(): boolean;
  onResult(
    result: InferenceResult,
    now: number,
    recognizedGestures: boolean,
  ): void;
  onStale(): void;
};

export function createPredictionLoop(options: PredictionLoopOptions) {
  let animationFrame = 0;
  let backgroundTimer = 0;
  let lastVideoTime = -1;
  let predicting = false;
  let epoch = 0;
  let lastGesturePredictionAt = Number.NEGATIVE_INFINITY;

  function start() {
    scheduleNext();
  }

  function restart() {
    epoch += 1;
    cancelScheduled();
    scheduleNext();
  }

  function stop() {
    epoch += 1;
    cancelScheduled();
    lastGesturePredictionAt = Number.NEGATIVE_INFINITY;
  }

  function scheduleNext() {
    cancelScheduled();
    if (!options.isActive()) return;

    if (document.hidden || options.isPaused()) {
      backgroundTimer = window.setTimeout(
        predict,
        BACKGROUND_PREDICTION_INTERVAL_MS,
      );
    } else {
      animationFrame = requestAnimationFrame(predict);
    }
  }

  function cancelScheduled() {
    cancelAnimationFrame(animationFrame);
    window.clearTimeout(backgroundTimer);
    animationFrame = 0;
    backgroundTimer = 0;
  }

  function predict() {
    const client = options.getClient();
    if (!client || !options.isActive()) return;
    if (predicting) {
      scheduleNext();
      return;
    }

    const now = performance.now();
    if (
      options.video.currentTime === lastVideoTime ||
      options.video.readyState < 2
    ) {
      scheduleNext();
      return;
    }

    lastVideoTime = options.video.currentTime;
    predicting = true;
    const predictionEpoch = epoch;
    const recognizeGestures =
      now - lastGesturePredictionAt >= GESTURE_PREDICTION_INTERVAL_MS;
    if (recognizeGestures) lastGesturePredictionAt = now;

    void createImageBitmap(options.video)
      .then((frame) =>
        client.detectForVideo(frame, now, recognizeGestures),
      )
      .then((result) => {
        if (!options.isActive() || predictionEpoch !== epoch) {
          options.onStale();
          return;
        }
        options.onResult(result, now, recognizeGestures);
      })
      .catch((error) => {
        if (predictionEpoch === epoch) {
          console.error("Inference failed.", error);
        }
      })
      .finally(() => {
        predicting = false;
        if (options.isActive()) scheduleNext();
      });
  }

  return { restart, start, stop };
}
