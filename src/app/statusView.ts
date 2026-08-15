import { setCatMood, type AppElements } from "../ui";
import type { Messages } from "../i18n";

export type PostureViewStatus = "idle" | "missing" | "good" | "bad" | "paused";
type MessagesProvider = () => Messages;

export function createStatusView(elements: AppElements, getMessages: MessagesProvider) {
  let currentStatus: PostureViewStatus = "idle";
  let currentProgress = 0;
  let currentBadDurationMs = 0;

  function setStartButtonLabel(label: string) {
    elements.startButtonLabel.textContent = label;
  }

  function setCameraMessage(message: string) {
    elements.placeholder.querySelector("p")!.textContent = message;
  }

  function setPostureBadge(status: PostureViewStatus, text: string) {
    elements.postureBadges.forEach((element) => {
      element.className = `posture-status__badge posture-status__badge--${status}`;
      element.textContent = text;
      const card = element.closest<HTMLElement>(".posture-status");
      card?.classList.remove(
        "posture-status--idle",
        "posture-status--missing",
        "posture-status--good",
        "posture-status--bad",
        "posture-status--paused",
      );
      card?.classList.add(`posture-status--${status}`);
    });
  }

  function setMeterProgress(progress: number) {
    elements.meterFills.forEach((element) => {
      element.style.width = `${Math.max(4, progress * 100)}%`;
    });
  }

  function updateStatus(
    status: PostureViewStatus,
    progress: number,
    badDurationMs: number,
  ) {
    const t = getMessages();
    currentStatus = status;
    currentProgress = progress;
    currentBadDurationMs = badDurationMs;
    setMeterProgress(progress);
    setCatMood(elements, status === "bad" ? "triggered" : "relaxed");

    if (status === "good") {
      setPostureBadge(status, t.posture.goodBadge);
      elements.statusLabel.textContent = t.calibration.watching;
      elements.statusPill.className = "status-pill";
    } else if (status === "bad") {
      const remaining = Math.max(
        0,
        Math.ceil((Number(elements.duration.value) - badDurationMs) / 1000),
      );
      setPostureBadge(
        status,
        remaining > 0 ? t.posture.badCountdown(remaining) : t.posture.badBadge,
      );
      elements.statusLabel.textContent = t.posture.badStatus;
      elements.statusPill.className = "status-pill status-pill--bad";
    } else if (status === "missing") {
      setPostureBadge(status, t.posture.missingBadge);
      elements.statusLabel.textContent = t.camera.lookingForPerson;
      elements.statusPill.className = "status-pill status-pill--missing";
    } else if (status === "paused") {
      setPostureBadge(status, t.posture.pausedBadge);
      elements.statusLabel.textContent = t.camera.statusPaused;
      elements.statusPill.className = "status-pill status-pill--paused";
    } else {
      setPostureBadge(status, t.posture.idleBadge);
      elements.statusPill.className = "status-pill";
    }
  }

  function refreshLocale() {
    updateStatus(currentStatus, currentProgress, currentBadDurationMs);
  }

  return {
    refreshLocale,
    setStartButtonLabel,
    setCameraMessage,
    setPostureBadge,
    setMeterProgress,
    updateStatus,
  };
}

export type StatusView = ReturnType<typeof createStatusView>;
