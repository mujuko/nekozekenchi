import { detectGestureCommand } from "../../domain/gesture/detectGesture";
import { createGestureHoldController } from "../../domain/gesture/gestureHold";
import type { GestureCommand } from "../../domain/gesture/types";
import type { Messages } from "../../localization/messages";
import type { GestureFeedbackView } from "../../ui/monitoring/gestureFeedbackView";
import type { SoundService } from "../sound/soundService";

type MessagesProvider = () => Messages;

type GestureCommandActions = {
  pause(): void;
  recalibrate(): void;
  resume(): void;
  stop(): void;
};

type GestureCommandState = {
  isCalibrating(): boolean;
  isPaused(): boolean;
};

export function createGestureCommandController(
  sound: SoundService,
  feedbackView: GestureFeedbackView,
  actions: GestureCommandActions,
  state: GestureCommandState,
  getMessages: MessagesProvider,
) {
  const hold = createGestureHoldController();

  function handleFrame(
    landmarks: Parameters<typeof detectGestureCommand>[0],
    hands: Parameters<typeof detectGestureCommand>[1],
    now: number,
  ) {
    let observed = detectGestureCommand(landmarks, hands);
    if (
      state.isCalibrating() &&
      observed !== "stop" &&
      observed !== "mute" &&
      observed !== "unmute"
    ) {
      observed = null;
    }
    if (observed === "pause" && state.isPaused()) observed = null;
    if (observed === "resume" && !state.isPaused()) observed = null;
    if (observed === "mute" && sound.isMuted()) observed = null;
    if (observed === "unmute" && !sound.isMuted()) observed = null;

    const holdResult = hold.update(observed, now);
    if (holdResult.started) void sound.playGestureRecognized();
    if (holdResult.triggered) {
      execute(holdResult.triggered, now);
      return;
    }
    if (holdResult.candidate) {
      const t = getMessages();
      feedbackView.showCandidate(
        t.gesture.hold(t.gesture[holdResult.candidate]),
        holdResult.progress,
      );
      return;
    }
    feedbackView.clear(false, now);
  }

  function execute(command: GestureCommand, now: number) {
    const t = getMessages();

    if (command === "unmute") {
      sound.unmute();
      void sound.playGestureConfirmed();
      feedbackView.showComplete(t.gesture.unmuted, now);
      return;
    }

    if (command === "stop") {
      void sound.playGestureConfirmed("shutdown");
      actions.stop();
      feedbackView.showComplete(t.gesture.stopped, now);
      return;
    }

    void sound.playGestureConfirmed();
    if (command === "pause") {
      actions.pause();
      feedbackView.showComplete(t.gesture.paused, now);
    } else if (command === "resume") {
      actions.resume();
      feedbackView.showComplete(t.gesture.resumed, now);
    } else if (command === "recalibrate") {
      actions.recalibrate();
      feedbackView.showComplete(t.gesture.recalibrating, now);
    } else if (command === "mute") {
      sound.mute();
      feedbackView.showComplete(t.gesture.muted, now);
    }
  }

  function reset() {
    hold.reset();
    feedbackView.clear(true);
  }

  return { handleFrame, reset };
}
