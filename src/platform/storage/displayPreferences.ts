export type DisplaySettings = {
  video: boolean;
  poseGuide: boolean;
  uprightLine: boolean;
  slouchLine: boolean;
};

export type DisplayPreferencesStore = {
  load(): DisplaySettings;
  save(settings: DisplaySettings): void;
};

const DISPLAY_SETTINGS_KEY = "nekozekenchi:display-settings";
const DEFAULT_SETTINGS: DisplaySettings = {
  video: true,
  poseGuide: false,
  uprightLine: false,
  slouchLine: true,
};

export function createDisplayPreferencesStore(): DisplayPreferencesStore {
  function load(): DisplaySettings {
    const savedSettings = localStorage.getItem(DISPLAY_SETTINGS_KEY);
    if (!savedSettings) return { ...DEFAULT_SETTINGS };

    try {
      const parsedSettings = JSON.parse(
        savedSettings,
      ) as Partial<DisplaySettings>;
      return {
        video: parsedSettings.video !== false,
        poseGuide: parsedSettings.poseGuide === true,
        uprightLine: parsedSettings.uprightLine === true,
        slouchLine: parsedSettings.slouchLine !== false,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function save(settings: DisplaySettings) {
    localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings));
  }

  return { load, save };
}

export function createDefaultDisplaySettings(): DisplaySettings {
  return { ...DEFAULT_SETTINGS };
}
