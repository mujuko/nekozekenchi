import {
  evaluatePosture,
  type PostureState,
} from "../../domain/posture/evaluatePosture";
import type { Messages } from "../../localization/messages";
import {
  getCameraStream,
  getStartupErrorMessage,
  isCameraContextAvailable,
  playVideo,
} from "../../platform/camera/camera";
import { createDesktopNotifier } from "../../platform/notification/desktopNotifier";
import {
  createLandmarker,
  type PoseInferenceClient,
} from "../../platform/pose/poseClient";
import type { InferenceResult } from "../../platform/pose/poseProtocol";
import type { AlertView } from "../../ui/monitoring/alertView";
import { createGestureFeedbackView } from "../../ui/monitoring/gestureFeedbackView";
import { createOverlay } from "../../ui/monitoring/overlayView";
import type { StatusView } from "../../ui/monitoring/statusView";
import type { DisplaySettingsController } from "../../ui/settings/displaySettingsController";
import type { MonitoringElements } from "../../ui/shell/appElements";
import type { SoundService } from "../sound/soundService";
import { createCalibrationController } from "./calibrationSession";
import { createGestureCommandController } from "./gestureCommandController";
import { createPredictionLoop } from "./predictionLoop";

type MessagesProvider = () => Messages;

export function createMonitoringSession(
  elements: MonitoringElements,
  statusView: StatusView,
  sound: SoundService,
  alertView: AlertView,
  displaySettings: DisplaySettingsController,
  getMessages: MessagesProvider,
) {
  let poseLandmarker: PoseInferenceClient | null = null;
  let stream: MediaStream | null = null;
  let paused = false;
  let postureState: PostureState = createEmptyPostureState();

  const overlay = createOverlay(
    elements,
    () => postureState,
    displaySettings.getSettings,
  );
  const desktopNotifier = createDesktopNotifier(getMessages);
  const calibration = createCalibrationController(
    elements,
    (state) => {
      postureState = state;
    },
    getMessages,
  );
  const gestureFeedback = createGestureFeedbackView(elements);
  const gestureCommands = createGestureCommandController(
    sound,
    gestureFeedback,
    {
      pause: pauseDetection,
      recalibrate: beginCalibration,
      resume: resumeDetection,
      stop: stopCamera,
    },
    {
      isCalibrating: calibration.isCalibrating,
      isPaused: () => paused,
    },
    getMessages,
  );
  const predictionLoop = createPredictionLoop({
    video: elements.video,
    getClient: () => poseLandmarker,
    isActive: () => stream !== null,
    isPaused: () => paused,
    onResult: handleInferenceResult,
    onStale: overlay.clear,
  });

  async function startCamera() {
    const startupMessages = getMessages();
    void sound.unlock();
    void desktopNotifier.requestPermission();

    if (!isCameraContextAvailable()) {
      showStartupError(startupMessages.camera.fileUnavailable);
      return;
    }

    elements.startButton.disabled = true;
    statusView.setStartButtonLabel(startupMessages.camera.waitingPermission);

    try {
      stream = await getCameraStream(getMessages());

      if (!poseLandmarker) {
        const loadingMessages = getMessages();
        statusView.setStartButtonLabel(loadingMessages.camera.loadingModel);
        statusView.setCameraMessage(loadingMessages.camera.loadingModelMessage);
        poseLandmarker = await createLandmarker(loadingMessages);
      }

      elements.video.srcObject = stream;
      await playVideo(elements.video, getMessages());

      elements.placeholder.hidden = true;
      elements.video.classList.add("camera__video--visible");
      elements.statusPill.hidden = false;
      elements.pauseButton.disabled = true;
      updatePauseButton(false);
      elements.calibrateButton.disabled = false;
      statusView.setStartButtonLabel(getMessages().camera.stop);
      elements.startButton.disabled = false;
      elements.startButton.classList.add("button--stop");
      elements.startButton.onclick = stopCamera;
      overlay.resizeCanvas();
      calibration.begin();
      predictionLoop.start();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      console.error(error);
      showStartupError(getStartupErrorMessage(error, getMessages()));
    }
  }

  function stopCamera() {
    predictionLoop.stop();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    elements.video.srcObject = null;
    overlay.clear();
    elements.video.classList.remove("camera__video--visible");
    elements.placeholder.hidden = false;
    elements.statusPill.hidden = true;
    elements.calibrationOverlay.hidden = true;
    calibration.reset();
    gestureCommands.reset();
    paused = false;
    elements.pauseButton.disabled = true;
    updatePauseButton(false);
    elements.calibrateButton.disabled = true;
    statusView.setStartButtonLabel(getMessages().camera.start);
    statusView.setCameraMessage(getMessages().camera.placeholderCopy);
    elements.startButton.classList.remove("button--stop");
    elements.startButton.onclick = startCamera;
    postureState = createEmptyPostureState();
    statusView.updateStatus("idle", 0, 0);
  }

  function pauseDetection() {
    if (!stream || paused || calibration.isCalibrating()) return;

    paused = true;
    predictionLoop.restart();
    overlay.clear();
    elements.calibrationOverlay.hidden = true;
    updatePauseButton(true);
    elements.calibrateButton.disabled = true;
    statusView.updateStatus("paused", 0, 0);
  }

  function resumeDetection() {
    if (!stream || !paused) return;

    paused = false;
    updatePauseButton(false);
    elements.calibrateButton.disabled = false;
    statusView.updateStatus("idle", 0, 0);
    predictionLoop.start();
  }

  function toggleDetectionPause() {
    if (paused) resumeDetection();
    else pauseDetection();
  }

  function updatePauseButton(isPaused: boolean) {
    const t = getMessages();
    elements.pauseButtonLabel.textContent = isPaused
      ? t.camera.resume
      : t.camera.pause;
    elements.pauseButtonPauseIcon.toggleAttribute("hidden", isPaused);
    elements.pauseButtonResumeIcon.toggleAttribute("hidden", !isPaused);
  }

  function handleInferenceResult(
    inferenceResult: InferenceResult,
    now: number,
    recognizedGestures: boolean,
  ) {
    const landmarks = inferenceResult.poseLandmarks;
    if (recognizedGestures) {
      gestureCommands.handleFrame(landmarks, inferenceResult.hands, now);
    }

    if (!stream || paused) {
      overlay.clear();
      return;
    }

    overlay.drawPose(landmarks);
    if (!landmarks) {
      elements.statusLabel.textContent = getMessages().camera.lookingForPerson;
      statusView.updateStatus("missing", 0, 0);
      return;
    }

    const nose = landmarks[0];
    if (!nose || (nose.visibility ?? 1) < 0.55) {
      statusView.updateStatus("missing", 0, 0);
      return;
    }

    if (calibration.isCalibrating()) {
      calibration.handleSample(nose.y, now);
      elements.pauseButton.disabled = calibration.isCalibrating();
      return;
    }

    const postureResult = evaluatePosture(nose.y, now, postureState, {
      threshold: Number(elements.sensitivity.value),
      warningDurationMs: Number(elements.duration.value),
      cooldownMs: 12000,
    });
    postureState = postureResult.state;

    if (postureResult.shouldAlert) {
      void sound.playAlert();
      desktopNotifier.notifyBadPosture();
      alertView.flash();
    }

    statusView.updateStatus(
      postureResult.isBad ? "bad" : "good",
      postureResult.score,
      postureResult.badDurationMs,
    );
  }

  function showStartupError(message: string) {
    const t = getMessages();
    elements.startButton.disabled = false;
    statusView.setStartButtonLabel(t.camera.retry);
    statusView.setCameraMessage(message);
    statusView.setPostureBadge("bad", t.camera.startupError);
  }

  function showUnsupportedStateIfNeeded() {
    if (isCameraContextAvailable()) return;

    elements.startButton.disabled = true;
    const t = getMessages();
    statusView.setStartButtonLabel(t.camera.localHostRequired);
    statusView.setCameraMessage(t.camera.filePreviewOnly);
  }

  function refreshLocale() {
    const t = getMessages();
    calibration.refreshLocale();
    statusView.refreshLocale();

    if (!isCameraContextAvailable()) {
      showUnsupportedStateIfNeeded();
    } else if (stream) {
      updatePauseButton(paused);
      statusView.setStartButtonLabel(t.camera.stop);
    } else if (!elements.startButton.disabled) {
      statusView.setStartButtonLabel(t.camera.start);
    }
  }

  function beginCalibration() {
    if (paused) resumeDetection();
    elements.pauseButton.disabled = true;
    updatePauseButton(false);
    calibration.begin();
  }

  window.addEventListener("resize", overlay.resizeCanvas);
  document.addEventListener("visibilitychange", () => {
    if (stream) predictionLoop.start();
  });
  elements.pauseButton.onclick = toggleDetectionPause;

  return {
    beginCalibration,
    refreshLocale,
    showUnsupportedStateIfNeeded,
    startCamera,
  };
}

function createEmptyPostureState(): PostureState {
  return { goodY: null, badY: null, badSince: null, lastAlertAt: null };
}
