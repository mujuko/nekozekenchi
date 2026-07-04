import { getMessages } from "../i18n";
import { createCalibrationEngine } from "../app/calibrationEngine";
import {
  getCameraStream,
  getStartupErrorMessage,
  playVideo,
} from "../app/camera";
import { createLandmarker } from "../app/poseLandmarker";
import { evaluatePosture, type PostureState } from "../posture";
import {
  DEFAULT_EXTENSION_SETTINGS,
  IDLE_SNAPSHOT,
  type BackgroundToOffscreenMessage,
  type ExtensionSettings,
  type MonitoringSnapshot,
} from "./messages";

const PREDICTION_INTERVAL_MS = 250;
const PREVIEW_INTERVAL_MS = 500;
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 240;
const ALERT_COOLDOWN_MS = 12_000;

const t = getMessages("ja");
const video = document.createElement("video");
video.muted = true;
video.playsInline = true;
document.body.append(video);

const previewCanvas = document.createElement("canvas");
previewCanvas.width = PREVIEW_WIDTH;
previewCanvas.height = PREVIEW_HEIGHT;

let poseLandmarker: Awaited<ReturnType<typeof createLandmarker>> | null = null;
let stream: MediaStream | null = null;
let predictionTimer = 0;
let lastVideoTime = -1;
let predicting = false;
let settings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS;
let postureState: PostureState = createEmptyPostureState();
let previewActive = false;
let lastPreviewAt = 0;
let currentSnapshot: MonitoringSnapshot = IDLE_SNAPSHOT;

const calibration = createCalibrationEngine();

chrome.runtime.onMessage.addListener((message) => {
  if (!isBackgroundToOffscreenMessage(message)) return;

  if (message.type === "START_MONITORING") {
    settings = message.settings;
    void startMonitoring();
    return;
  }

  if (message.type === "STOP_MONITORING") {
    stopMonitoring();
    return;
  }

  if (message.type === "BEGIN_CALIBRATION") {
    beginCalibration();
    return;
  }

  if (message.type === "UPDATE_SETTINGS") {
    settings = message.settings;
    return;
  }

  if (message.type === "SET_PREVIEW_ACTIVE") {
    previewActive = message.active;
  }
});

async function startMonitoring() {
  if (stream) {
    sendStatus(currentSnapshot);
    return;
  }

  sendStatus({
    ...IDLE_SNAPSHOT,
    monitoring: true,
    status: "starting",
    message: t.camera.waitingPermission,
  });

  try {
    stream = await getCameraStream(t);

    sendStatus({
      ...currentSnapshot,
      monitoring: true,
      status: "starting",
      message: t.camera.loadingModel,
    });

    poseLandmarker ??= await createLandmarker(t);
    video.srcObject = stream;
    await playVideo(video, t);
    beginCalibration();
    scheduleNextPrediction();
  } catch (error) {
    stopMonitoring(false);
    sendStatus({
      ...IDLE_SNAPSHOT,
      status: "error",
      message: getStartupErrorMessage(error, t),
    });
  }
}

function stopMonitoring(notifyStopped = true) {
  window.clearTimeout(predictionTimer);
  predictionTimer = 0;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  predicting = false;
  lastVideoTime = -1;
  lastPreviewAt = 0;
  calibration.reset();
  postureState = createEmptyPostureState();
  currentSnapshot = IDLE_SNAPSHOT;
  sendStatus(currentSnapshot);

  if (notifyStopped) {
    void chrome.runtime.sendMessage({
      target: "background",
      type: "OFFSCREEN_STOPPED",
    });
  }
}

function beginCalibration() {
  if (!stream) return;
  postureState = createEmptyPostureState();
  calibration.begin();
  sendStatus({
    monitoring: true,
    status: "calibrating",
    score: 0,
    badDurationMs: 0,
    message: getCalibrationMessage(calibration.getSnapshot()),
    calibration: calibration.getSnapshot(),
  });
}

function scheduleNextPrediction() {
  window.clearTimeout(predictionTimer);
  predictionTimer = window.setTimeout(predict, PREDICTION_INTERVAL_MS);
}

function predict() {
  if (!poseLandmarker || !stream) return;

  if (predicting) {
    scheduleNextPrediction();
    return;
  }

  const now = performance.now();
  maybeSendPreview(now);

  if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
    lastVideoTime = video.currentTime;
    predicting = true;
    poseLandmarker.detectForVideo(video, now, (poseResult) => {
      predicting = false;
      if (!stream) return;

      const landmarks = poseResult.landmarks[0];
      if (!landmarks) {
        sendStatus(createStatus("missing", 0, 0, t.posture.missingMessage));
        return;
      }

      const nose = landmarks[0];
      if (!nose || (nose.visibility ?? 1) < 0.55) {
        sendStatus(createStatus("missing", 0, 0, t.posture.missingMessage));
        return;
      }

      if (calibration.isActive()) {
        const result = calibration.handleSample(nose.y, now);
        if (result.calibratedState) {
          postureState = result.calibratedState;
          sendStatus(createStatus("watching", 0, 0, t.calibration.watching));
          return;
        }

        sendStatus({
          monitoring: true,
          status: "calibrating",
          score: 0,
          badDurationMs: 0,
          message: getCalibrationMessage(result.snapshot),
          calibration: result.snapshot,
        });
        return;
      }

      const postureResult = evaluatePosture(nose.y, now, postureState, {
        threshold: settings.sensitivity,
        warningDurationMs: settings.warningDurationMs,
        cooldownMs: ALERT_COOLDOWN_MS,
      });
      postureState = postureResult.state;

      if (postureResult.shouldAlert) {
        void chrome.runtime.sendMessage({
          target: "background",
          type: "BAD_POSTURE_ALERT",
        });
      }

      sendStatus(
        createStatus(
          postureResult.isBad ? "bad" : "good",
          postureResult.score,
          postureResult.badDurationMs,
          postureResult.isBad
            ? getBadPostureMessage(postureResult.badDurationMs)
            : t.posture.goodMessage,
        ),
      );
    });
  }

  scheduleNextPrediction();
}

function maybeSendPreview(now: number) {
  if (!previewActive || now - lastPreviewAt < PREVIEW_INTERVAL_MS) return;
  if (video.readyState < 2) return;

  lastPreviewAt = now;
  const context = previewCanvas.getContext("2d");
  if (!context) return;

  context.save();
  context.translate(PREVIEW_WIDTH, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
  context.restore();

  void chrome.runtime.sendMessage({
    target: "background",
    type: "PREVIEW_FRAME",
    dataUrl: previewCanvas.toDataURL("image/jpeg", 0.68),
  });
}

function sendStatus(snapshot: MonitoringSnapshot) {
  currentSnapshot = snapshot;
  void chrome.runtime.sendMessage({
    target: "background",
    type: "STATUS_UPDATE",
    snapshot,
  });
}

function createStatus(
  status: MonitoringSnapshot["status"],
  score: number,
  badDurationMs: number,
  message: string,
): MonitoringSnapshot {
  return {
    monitoring: true,
    status,
    score,
    badDurationMs,
    message,
    calibration: calibration.getSnapshot(),
  };
}

function getCalibrationMessage(snapshot: ReturnType<typeof calibration.getSnapshot>) {
  if (!snapshot.active || snapshot.step === null) return t.calibration.watching;
  const remainingSeconds = Math.max(1, Math.ceil(snapshot.remainingMs / 1000));

  if (snapshot.step === "good") {
    return `${t.calibration.goodTitle}（${remainingSeconds}秒）`;
  }
  if (snapshot.step === "transition") {
    return `${t.calibration.transitionTitle}（${remainingSeconds}秒）`;
  }
  return `${t.calibration.badTitle}（${remainingSeconds}秒）`;
}

function getBadPostureMessage(badDurationMs: number) {
  const remaining = Math.max(
    0,
    Math.ceil((settings.warningDurationMs - badDurationMs) / 1000),
  );
  return remaining > 0
    ? `${t.posture.badMessageWarning} ${t.posture.badCountdown(remaining)}`
    : t.posture.badMessageAlert;
}

function createEmptyPostureState(): PostureState {
  return { goodY: null, badY: null, badSince: null, lastAlertAt: null };
}

function isBackgroundToOffscreenMessage(
  message: unknown,
): message is BackgroundToOffscreenMessage {
  if (typeof message !== "object" || message === null) return false;
  const record = message as Record<string, unknown>;
  if (record.target !== "offscreen") return false;

  return [
    "START_MONITORING",
    "STOP_MONITORING",
    "BEGIN_CALIBRATION",
    "UPDATE_SETTINGS",
    "SET_PREVIEW_ACTIVE",
  ].includes(String(record.type));
}
