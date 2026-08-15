export const DEFAULT_SOUND_VOLUME = 50;

export const SOUND_CHOICE_IDS = [
  "tone",
  "cat10",
  "cat11",
  "cat15",
  "cat30",
] as const;

export type SoundChoiceId = (typeof SOUND_CHOICE_IDS)[number];

export const DEFAULT_SOUND_CHOICE: SoundChoiceId = "cat10";
export const DEFAULT_SOUND_CHOICES: SoundChoiceId[] = [
  "cat10",
  "cat11",
  "cat15",
  "cat30",
];

export type SoundPreferences = {
  volume: number;
  lastAudibleVolume: number;
  choices: SoundChoiceId[];
};

export function clampVolume(volume: number) {
  return Math.min(100, Math.max(0, Math.round(volume / 5) * 5));
}

export function isSoundChoiceId(value: unknown): value is SoundChoiceId {
  return (
    typeof value === "string" &&
    SOUND_CHOICE_IDS.includes(value as SoundChoiceId)
  );
}
