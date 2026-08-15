import {
  DEFAULT_SOUND_CHOICE,
  DEFAULT_SOUND_VOLUME,
  clampVolume,
  type SoundChoiceId,
  type SoundPreferences,
} from "./soundTypes";

export type AudioOutput = {
  unlock(): Promise<void>;
  playAlert(choice: SoundChoiceId, volume: number): Promise<void>;
  playGestureRecognized(volume: number): Promise<void>;
  playGestureConfirmed(
    volume: number,
    tone?: "default" | "shutdown",
  ): Promise<void>;
};

export type SoundPreferencesStore = {
  load(): SoundPreferences;
  save(preferences: SoundPreferences): void;
};

export function createSoundService(
  audioOutput: AudioOutput,
  preferencesStore: SoundPreferencesStore,
) {
  let preferences: SoundPreferences = {
    volume: DEFAULT_SOUND_VOLUME,
    lastAudibleVolume: DEFAULT_SOUND_VOLUME,
    choices: [DEFAULT_SOUND_CHOICE],
  };
  const listeners = new Set<() => void>();

  function loadSettings() {
    preferences = preferencesStore.load();
    notify();
  }

  function getSettings(): Readonly<SoundPreferences> {
    return preferences;
  }

  function setVolume(volume: number) {
    const nextVolume = clampVolume(volume);
    preferences = {
      ...preferences,
      volume: nextVolume,
      lastAudibleVolume:
        nextVolume > 0 ? nextVolume : preferences.lastAudibleVolume,
    };
    saveAndNotify();
  }

  function setChoices(choices: SoundChoiceId[]) {
    preferences = {
      ...preferences,
      choices: choices.length > 0 ? choices : [DEFAULT_SOUND_CHOICE],
    };
    saveAndNotify();
  }

  function isMuted() {
    return preferences.volume <= 0;
  }

  function mute() {
    if (!isMuted()) setVolume(0);
  }

  function unmute() {
    if (isMuted()) setVolume(preferences.lastAudibleVolume);
  }

  async function playAlert() {
    if (isMuted()) return;
    const choices = preferences.choices;
    const choice =
      choices[Math.floor(Math.random() * choices.length)] ??
      DEFAULT_SOUND_CHOICE;
    await audioOutput.playAlert(choice, preferences.volume);
  }

  async function playGestureRecognized() {
    if (!isMuted()) {
      await audioOutput.playGestureRecognized(preferences.volume);
    }
  }

  async function playGestureConfirmed(
    tone: "default" | "shutdown" = "default",
  ) {
    if (!isMuted()) {
      await audioOutput.playGestureConfirmed(preferences.volume, tone);
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function saveAndNotify() {
    preferencesStore.save(preferences);
    notify();
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    getSettings,
    isMuted,
    loadSettings,
    mute,
    playAlert,
    playGestureConfirmed,
    playGestureRecognized,
    setChoices,
    setVolume,
    subscribe,
    unmute,
    unlock: audioOutput.unlock,
  };
}

export type SoundService = ReturnType<typeof createSoundService>;
