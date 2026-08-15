import {
  DEFAULT_SOUND_CHOICE,
  DEFAULT_SOUND_VOLUME,
  clampVolume,
  isSoundChoiceId,
  type SoundChoiceId,
  type SoundPreferences,
} from "../../app/sound/soundTypes";
import type { SoundPreferencesStore } from "../../app/sound/soundService";

const SOUND_VOLUME_KEY = "nekozekenchi:sound-volume";
const SOUND_MUTED_KEY = "nekozekenchi:sound-muted";
const SOUND_LAST_AUDIBLE_VOLUME_KEY = "nekozekenchi:sound-last-audible-volume";
const SOUND_CHOICES_KEY = "nekozekenchi:sound-choices";

export function createSoundPreferencesStore(): SoundPreferencesStore {
  function load(): SoundPreferences {
    const savedVolumeRaw = localStorage.getItem(SOUND_VOLUME_KEY);
    const savedVolume = Number(savedVolumeRaw);
    const savedLastAudibleVolume = Number(
      localStorage.getItem(SOUND_LAST_AUDIBLE_VOLUME_KEY),
    );
    const mutedByOldSetting = localStorage.getItem(SOUND_MUTED_KEY) === "true";
    const initialVolume =
      savedVolumeRaw !== null && Number.isFinite(savedVolume)
        ? clampVolume(savedVolume)
        : DEFAULT_SOUND_VOLUME;
    const lastAudibleVolume =
      Number.isFinite(savedLastAudibleVolume) && savedLastAudibleVolume > 0
        ? clampVolume(savedLastAudibleVolume)
        : initialVolume > 0
          ? initialVolume
          : DEFAULT_SOUND_VOLUME;

    return {
      volume: mutedByOldSetting ? 0 : initialVolume,
      lastAudibleVolume,
      choices: loadSoundChoices(),
    };
  }

  function save(preferences: SoundPreferences) {
    localStorage.setItem(SOUND_VOLUME_KEY, String(preferences.volume));
    localStorage.setItem(
      SOUND_LAST_AUDIBLE_VOLUME_KEY,
      String(preferences.lastAudibleVolume),
    );
    localStorage.setItem(
      SOUND_CHOICES_KEY,
      JSON.stringify(preferences.choices),
    );
    localStorage.removeItem(SOUND_MUTED_KEY);
  }

  return { load, save };
}

function loadSoundChoices(): SoundChoiceId[] {
  const savedChoices = localStorage.getItem(SOUND_CHOICES_KEY);
  if (!savedChoices) return [DEFAULT_SOUND_CHOICE];

  try {
    const parsedChoices = JSON.parse(savedChoices);
    if (!Array.isArray(parsedChoices)) return [DEFAULT_SOUND_CHOICE];

    const validChoices = parsedChoices.filter(isSoundChoiceId);
    return validChoices.length > 0 ? validChoices : [DEFAULT_SOUND_CHOICE];
  } catch {
    return [DEFAULT_SOUND_CHOICE];
  }
}
