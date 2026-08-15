import type { MonitoringElements } from "../shell/appElements";

const GESTURE_COMPLETE_DISPLAY_MS = 1800;

export function createGestureFeedbackView(elements: MonitoringElements) {
  let visibleUntil = 0;
  let hideTimer = 0;

  function showCandidate(message: string, progress: number) {
    window.clearTimeout(hideTimer);
    visibleUntil = 0;
    elements.gestureFeedback.hidden = false;
    elements.gestureFeedback.classList.remove("gesture-feedback--complete");
    elements.gestureFeedbackLabel.textContent = message;
    elements.gestureProgressBar.style.width = `${Math.round(progress * 100)}%`;
  }

  function showComplete(message: string, now: number) {
    window.clearTimeout(hideTimer);
    visibleUntil = now + GESTURE_COMPLETE_DISPLAY_MS;
    elements.gestureFeedback.hidden = false;
    elements.gestureFeedback.classList.add("gesture-feedback--complete");
    elements.gestureFeedbackLabel.textContent = message;
    elements.gestureProgressBar.style.width = "100%";
    hideTimer = window.setTimeout(() => {
      clear(true);
    }, GESTURE_COMPLETE_DISPLAY_MS);
  }

  function clear(force: boolean, now = performance.now()) {
    if (!force && now < visibleUntil) return;
    window.clearTimeout(hideTimer);
    hideTimer = 0;
    visibleUntil = 0;
    elements.gestureFeedback.hidden = true;
    elements.gestureFeedback.classList.remove("gesture-feedback--complete");
    elements.gestureProgressBar.style.width = "0";
  }

  return { clear, showCandidate, showComplete };
}

export type GestureFeedbackView = ReturnType<typeof createGestureFeedbackView>;
