import type { DisplaySettingsElements } from "../shell/appElements";
import {
  createDefaultDisplaySettings,
  type DisplayPreferencesStore,
  type DisplaySettings,
} from "../../platform/storage/displayPreferences";

export function createDisplaySettingsController(
  elements: DisplaySettingsElements,
  preferencesStore: DisplayPreferencesStore,
) {
  let settings = createDefaultDisplaySettings();

  function loadSettings() {
    settings = preferencesStore.load();
    elements.displayChoices.forEach((choice) => {
      choice.checked = settings[choice.value as keyof DisplaySettings];
    });
    applyVideoVisibility();
  }

  function bindControls() {
    elements.displayChoices.forEach((choice) => {
      choice.addEventListener("change", () => {
        settings = getSettingsFromControls();
        applyVideoVisibility();
        preferencesStore.save(settings);
      });
    });
  }

  function getSettings() {
    return settings;
  }

  function getSettingsFromControls(): DisplaySettings {
    const nextSettings = createDefaultDisplaySettings();
    elements.displayChoices.forEach((choice) => {
      nextSettings[choice.value as keyof DisplaySettings] = choice.checked;
    });
    return nextSettings;
  }

  function applyVideoVisibility() {
    elements.video.classList.toggle("camera__video--hidden", !settings.video);
  }

  return { bindControls, getSettings, loadSettings };
}

export type DisplaySettingsController = ReturnType<
  typeof createDisplaySettingsController
>;
