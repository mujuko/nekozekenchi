import { createMonitoringSession } from "./monitoring/monitoringSession";
import { createSoundService } from "./sound/soundService";
import {
  getMessages,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "../localization/locale";
import { createStatusView } from "../ui/monitoring/statusView";
import { createAlertView } from "../ui/monitoring/alertView";
import { bindMobileMenu } from "../ui/navigation/mobileMenuController";
import { createDisplaySettingsController } from "../ui/settings/displaySettingsController";
import { createSoundSettingsController } from "../ui/settings/soundSettingsController";
import { getAppElements } from "../ui/shell/appElements";
import { renderApp } from "../ui/shell/appTemplate";
import { updateAppLocale } from "../ui/shell/localeView";
import { createAudioOutput } from "../platform/audio/audioOutput";
import { createSoundPreferencesStore } from "../platform/storage/soundPreferences";
import { createDisplayPreferencesStore } from "../platform/storage/displayPreferences";

const APP_VERSION = import.meta.env.VITE_APP_VERSION;

export function bootstrapApp() {
  let locale = getInitialLocale();
  let t = getMessages(locale);
  const getCurrentMessages = () => t;

  document.documentElement.lang = locale;
  document.title = t.meta.title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", t.meta.description);
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = renderApp(
    APP_VERSION,
    t,
    locale,
  );

  const elements = getAppElements();
  const statusView = createStatusView(elements.monitoring, getCurrentMessages);
  const sound = createSoundService(
    createAudioOutput(),
    createSoundPreferencesStore(),
  );
  const soundSettings = createSoundSettingsController(
    elements.soundSettings,
    sound,
    getCurrentMessages,
  );
  const alertView = createAlertView(elements.alert);
  const displaySettings = createDisplaySettingsController(
    elements.displaySettings,
    createDisplayPreferencesStore(),
  );
  const monitoringSession = createMonitoringSession(
    elements.monitoring,
    statusView,
    sound,
    alertView,
    displaySettings,
    getCurrentMessages,
  );

  elements.monitoring.startButton.onclick = monitoringSession.startCamera;
  elements.monitoring.calibrateButton.onclick =
    monitoringSession.beginCalibration;
  elements.localization.localeSelects.forEach((select) => {
    select.addEventListener("change", () => {
      const nextLocale = select.value;
      if (!isLocale(nextLocale) || nextLocale === locale) return;
      locale = nextLocale;
      t = getMessages(locale);
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      window.history.pushState(null, "", getLocalePath(nextLocale));
      updateAppLocale(APP_VERSION, elements, t, locale);
      soundSettings.updateControls();
      monitoringSession.refreshLocale();
    });
  });

  soundSettings.bindControls();
  displaySettings.bindControls();
  bindMobileMenu(elements.navigation);
  monitoringSession.showUnsupportedStateIfNeeded();
  soundSettings.loadSettings();
  displaySettings.loadSettings();
}

function getInitialLocale(): Locale {
  const pathLocale = getPathLocale();
  if (pathLocale) return pathLocale;

  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(savedLocale) ? savedLocale : "ja";
}

function getPathLocale(): Locale | undefined {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/en") return "en";
  if (path === "") return "ja";

  return undefined;
}

function getLocalePath(nextLocale: Locale) {
  return nextLocale === "en" ? "/en/" : "/";
}
