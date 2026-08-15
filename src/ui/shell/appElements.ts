export function getAppElements() {
  const video = query<HTMLVideoElement>("#video");

  return {
    monitoring: {
      video,
      canvas: query<HTMLCanvasElement>("#overlay"),
      cameraStage: query<HTMLDivElement>("#camera-stage"),
      placeholder: query<HTMLDivElement>("#camera-placeholder"),
      calibrationOverlay: query<HTMLDivElement>("#calibration-overlay"),
      countdown: query<HTMLSpanElement>("#countdown"),
      calibrationTitle: query<HTMLElement>("#calibration-title"),
      calibrationHelp: query<HTMLElement>("#calibration-help"),
      startButton: query<HTMLButtonElement>("#start-button"),
      startButtonLabel: query<HTMLSpanElement>("#start-button-label"),
      pauseButton: query<HTMLButtonElement>("#pause-button"),
      pauseButtonLabel: query<HTMLSpanElement>("#pause-button-label"),
      pauseButtonPauseIcon: query<SVGElement>("#pause-button-pause-icon"),
      pauseButtonResumeIcon: query<SVGElement>("#pause-button-resume-icon"),
      calibrateButton: query<HTMLButtonElement>("#calibrate-button"),
      calibrateButtonLabel: query<HTMLSpanElement>("#calibrate-button-label"),
      statusPill: query<HTMLDivElement>("#status-pill"),
      statusLabel: query<HTMLElement>("#status-label"),
      gestureFeedback: query<HTMLDivElement>("#gesture-feedback"),
      gestureFeedbackLabel: query<HTMLElement>("#gesture-feedback-label"),
      gestureProgressBar: query<HTMLElement>("#gesture-progress-bar"),
      gestureGuide: query<HTMLParagraphElement>("#gesture-guide"),
      catIcons: queryAll<HTMLImageElement>("[data-cat-icon]"),
      postureBadges: queryAll<HTMLDivElement>("[data-posture-badge]"),
      meterFills: queryAll<HTMLDivElement>("[data-meter-fill]"),
      sensitivity: query<HTMLSelectElement>("#sensitivity"),
      duration: query<HTMLSelectElement>("#duration"),
    },
    displaySettings: {
      video,
      displayChoices: queryAll<HTMLInputElement>("[data-display-choice]"),
    },
    soundSettings: {
      soundChoices: queryAll<HTMLInputElement>("[data-sound-choice]"),
      soundVolume: query<HTMLInputElement>("#sound-volume"),
      muteButton: query<HTMLButtonElement>("#mute-button"),
      soundButton: query<HTMLButtonElement>("#sound-button"),
    },
    alert: {
      alertFlash: query<HTMLDivElement>("#alert-flash"),
    },
    navigation: {
      menuButton: document.querySelector<HTMLButtonElement>("#menu-button"),
      closeMenuButton:
        document.querySelector<HTMLButtonElement>("#close-menu-button"),
      menuScrim: document.querySelector<HTMLDivElement>("#menu-scrim"),
      mobileMenu: query<HTMLElement>("#mobile-menu"),
    },
    localization: {
      localeSelects: queryAll<HTMLSelectElement>("[data-locale-select]"),
    },
  };
}

export type AppElements = ReturnType<typeof getAppElements>;
export type MonitoringElements = AppElements["monitoring"];
export type DisplaySettingsElements = AppElements["displaySettings"];
export type SoundSettingsElements = AppElements["soundSettings"];
export type AlertElements = AppElements["alert"];
export type NavigationElements = AppElements["navigation"];

function query<T extends Element>(selector: string): T {
  return document.querySelector<T>(selector)!;
}

function queryAll<T extends Element>(selector: string): NodeListOf<T> {
  return document.querySelectorAll<T>(selector);
}
