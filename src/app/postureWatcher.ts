import { evaluatePosture, type PostureState } from "../posture";
import type { AppElements } from "../ui";
import type { Messages } from "../i18n";
import {
  getCameraStream,
  getStartupErrorMessage,
  isCameraContextAvailable,
  playVideo,
} from "./camera";
import { createCalibrationController } from "./calibration";
import { createDesktopNotifier } from "./desktopNotification";
import { createOverlay } from "./overlay";
import {
  createGestureHoldController,
  detectGestureCommand,
  type GestureCommand,
} from "./gesture";
import {
  createLandmarker,
  type PoseInferenceClient,
} from "./poseLandmarker";
import type { SoundController } from "./sound";
import type { StatusView } from "./statusView";
import type { DisplaySettingsController } from "./displaySettings";

type MessagesProvider = () => Messages;

export function createPostureWatcher(
  elements: AppElements,
  statusView: StatusView,
  sound: SoundController,
  displaySettings: DisplaySettingsController,
  getMessages: MessagesProvider,
) {
  const BACKGROUND_PREDICTION_INTERVAL_MS = 125;
  const GESTURE_PREDICTION_INTERVAL_MS = 125;
  const GESTURE_COMPLETE_DISPLAY_MS = 1800;

  let poseLandmarker: PoseInferenceClient | null = null;
  let stream: MediaStream | null = null;
  let animationFrame = 0;
  let backgroundTimer = 0;
  let lastVideoTime = -1;
  let predicting = false;
  let predictionEpoch = 0;
  let lastGesturePredictionAt = Number.NEGATIVE_INFINITY;
  let gestureFeedbackUntil = 0;
  let gestureFeedbackTimer = 0;
  let paused = false;
  let postureState: PostureState = createEmptyPostureState();

  const overlay = createOverlay(
    elements,
    () => postureState,
    displaySettings.getSettings,
  );
  const desktopNotifier = createDesktopNotifier(getMessages);
  const gestureHold = createGestureHoldController();
  const calibration = createCalibrationController(
    elements,
    (state) => {
      postureState = state;
    },
    getMessages,
  );

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
      const mediaStream = await getCameraStream(getMessages());
      stream = mediaStream;

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
      scheduleNextPrediction();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      console.error(error);
      showStartupError(getStartupErrorMessage(error, getMessages()));
    }
  }

  function stopCamera() {
    predictionEpoch += 1;
    cancelScheduledPrediction();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    elements.video.srcObject = null;
    overlay.clear();
    elements.video.classList.remove("camera__video--visible");
    elements.placeholder.hidden = false;
    elements.statusPill.hidden = true;
    elements.calibrationOverlay.hidden = true;
    calibration.reset();
    gestureHold.reset();
    lastGesturePredictionAt = Number.NEGATIVE_INFINITY;
    clearGestureFeedback(true);
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

  function updatePauseButton(isPaused: boolean) {
    const t = getMessages();
    elements.pauseButtonLabel.textContent = isPaused ? t.camera.resume : t.camera.pause;
    elements.pauseButtonPauseIcon.toggleAttribute("hidden", isPaused);
    elements.pauseButtonResumeIcon.toggleAttribute("hidden", !isPaused);
  }

  function pauseDetection() {
    if (!stream || paused || calibration.isCalibrating()) return;

    paused = true;
    predictionEpoch += 1;
    cancelScheduledPrediction();
    overlay.clear();
    elements.calibrationOverlay.hidden = true;
    updatePauseButton(true);
    elements.calibrateButton.disabled = true;
    statusView.updateStatus("paused", 0, 0);
    scheduleNextPrediction();
  }

  function resumeDetection() {
    if (!stream || !paused) return;

    paused = false;
    updatePauseButton(false);
    elements.calibrateButton.disabled = false;
    statusView.updateStatus("idle", 0, 0);
    scheduleNextPrediction();
  }

  function toggleDetectionPause() {
    if (paused) {
      resumeDetection();
      return;
    }

    pauseDetection();
  }

  function cancelScheduledPrediction() {
    cancelAnimationFrame(animationFrame);
    window.clearTimeout(backgroundTimer);
    animationFrame = 0;
    backgroundTimer = 0;
  }

  function scheduleNextPrediction() {
    cancelAnimationFrame(animationFrame);
    window.clearTimeout(backgroundTimer);

    if (document.hidden || paused) {
      backgroundTimer = window.setTimeout(
        predict,
        BACKGROUND_PREDICTION_INTERVAL_MS,
      );
      return;
    }

    animationFrame = requestAnimationFrame(predict);
  }

  function predict() {
    if (!poseLandmarker || !stream) return;
    const landmarker = poseLandmarker;
    if (predicting) {
      scheduleNextPrediction();
      return;
    }

    const now = performance.now();
    if (elements.video.currentTime !== lastVideoTime && elements.video.readyState >= 2) {
      lastVideoTime = elements.video.currentTime;
      predicting = true;
      const epoch = predictionEpoch;
      const recognizeGestures =
        now - lastGesturePredictionAt >= GESTURE_PREDICTION_INTERVAL_MS;
      if (recognizeGestures) lastGesturePredictionAt = now;
      void createImageBitmap(elements.video)
        .then((frame) =>
          landmarker.detectForVideo(frame, now, recognizeGestures),
        )
        .then((inferenceResult) => {
          if (!stream || epoch !== predictionEpoch) {
            overlay.clear();
            return;
          }

          const landmarks = inferenceResult.poseLandmarks;
          if (recognizeGestures) {
            handleGestureFrame(landmarks, inferenceResult.hands, now);
          }

          if (!stream || paused || epoch !== predictionEpoch) {
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
            sound.flashAlert();
          }

          statusView.updateStatus(
            postureResult.isBad ? "bad" : "good",
            postureResult.score,
            postureResult.badDurationMs,
          );
        })
        .catch((error) => {
          if (epoch === predictionEpoch) {
            console.error("Inference failed.", error);
          }
        })
        .finally(() => {
          predicting = false;
          if (stream) scheduleNextPrediction();
        });
      return;
    }

    scheduleNextPrediction();
  }

  function handleGestureFrame(
    landmarks: Parameters<typeof detectGestureCommand>[0],
    hands: Parameters<typeof detectGestureCommand>[1],
    now: number,
  ) {
    let observed = detectGestureCommand(landmarks, hands);
    if (
      calibration.isCalibrating() &&
      observed !== "stop" &&
      observed !== "mute" &&
      observed !== "unmute"
    ) {
      observed = null;
    }
    if (observed === "pause" && paused) observed = null;
    if (observed === "resume" && !paused) observed = null;
    if (observed === "mute" && sound.isMuted()) observed = null;
    if (observed === "unmute" && !sound.isMuted()) observed = null;

    const holdResult = gestureHold.update(observed, now);
    if (holdResult.started) {
      void sound.playGestureRecognized();
    }
    if (holdResult.triggered) {
      executeGestureCommand(holdResult.triggered, now);
      return;
    }
    if (holdResult.candidate) {
      showGestureCandidate(holdResult.candidate, holdResult.progress);
      return;
    }
    clearGestureFeedback(false, now);
  }

  function executeGestureCommand(command: GestureCommand, now: number) {
    const t = getMessages();

    if (command === "unmute") {
      sound.unmute();
      void sound.playGestureConfirmed();
      showGestureComplete(t.gesture.unmuted, now);
      return;
    }

    if (command === "stop") {
      void sound.playGestureConfirmed("shutdown");
      stopCamera();
      showGestureComplete(t.gesture.stopped, now);
      return;
    }

    void sound.playGestureConfirmed();
    if (command === "pause") {
      pauseDetection();
      showGestureComplete(t.gesture.paused, now);
      return;
    }
    if (command === "resume") {
      resumeDetection();
      showGestureComplete(t.gesture.resumed, now);
      return;
    }
    if (command === "recalibrate") {
      beginCalibration();
      showGestureComplete(t.gesture.recalibrating, now);
      return;
    }

    if (command === "mute") {
      sound.mute();
      showGestureComplete(t.gesture.muted, now);
      return;
    }
  }

  function showGestureCandidate(command: GestureCommand, progress: number) {
    const t = getMessages();
    const gestureName = t.gesture[command];
    window.clearTimeout(gestureFeedbackTimer);
    gestureFeedbackUntil = 0;
    elements.gestureFeedback.hidden = false;
    elements.gestureFeedback.classList.remove("gesture-feedback--complete");
    elements.gestureFeedbackLabel.textContent = t.gesture.hold(gestureName);
    elements.gestureProgressBar.style.width = `${Math.round(progress * 100)}%`;
  }

  function showGestureComplete(message: string, now: number) {
    window.clearTimeout(gestureFeedbackTimer);
    gestureFeedbackUntil = now + GESTURE_COMPLETE_DISPLAY_MS;
    elements.gestureFeedback.hidden = false;
    elements.gestureFeedback.classList.add("gesture-feedback--complete");
    elements.gestureFeedbackLabel.textContent = message;
    elements.gestureProgressBar.style.width = "100%";
    gestureFeedbackTimer = window.setTimeout(() => {
      clearGestureFeedback(true);
    }, GESTURE_COMPLETE_DISPLAY_MS);
  }

  function clearGestureFeedback(force: boolean, now = performance.now()) {
    if (!force && now < gestureFeedbackUntil) return;
    window.clearTimeout(gestureFeedbackTimer);
    gestureFeedbackTimer = 0;
    gestureFeedbackUntil = 0;
    elements.gestureFeedback.hidden = true;
    elements.gestureFeedback.classList.remove("gesture-feedback--complete");
    elements.gestureProgressBar.style.width = "0";
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
      return;
    }

    if (stream) {
      updatePauseButton(paused);
      statusView.setStartButtonLabel(t.camera.stop);
      return;
    }

    if (!elements.startButton.disabled) {
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
    if (!stream) return;
    scheduleNextPrediction();
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
