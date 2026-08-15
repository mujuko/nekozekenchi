import type { AudioOutput } from "../../app/sound/soundService";
import type { SoundChoiceId } from "../../app/sound/soundTypes";

const BASE_ALERT_GAIN = 0.22;
const MAX_ALERT_GAIN = 1;
const GESTURE_RECOGNIZED_GAIN = 0.16;
const GESTURE_CONFIRMED_GAIN = 0.24;

const SOUND_FILES: Partial<Record<SoundChoiceId, string>> = {
  cat10: "/cat/cat10.mp3",
  cat11: "/cat/cat11.mp3",
  cat15: "/cat/cat15.mp3",
  cat30: "/cat/cat30.mp3",
};

export function createAudioOutput(): AudioOutput {
  let audio: AudioContext | null = null;
  const audioBuffers = new Map<string, AudioBuffer>();

  function createAudioContext() {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    return new AudioContextClass();
  }

  async function unlock() {
    audio ??= createAudioContext();
    if (audio.state === "suspended") await audio.resume();
  }

  async function playAlert(choice: SoundChoiceId, volumePercent: number) {
    const volume = volumePercent / 100;
    if (volume <= 0) return;

    await unlock();
    if (!audio) return;

    const path = SOUND_FILES[choice];
    if (path) {
      await playAudioFile(choice, path, volume);
    } else {
      playTone(volume);
    }
  }

  async function playGestureRecognized(volumePercent: number) {
    await playGestureTone("recognized", volumePercent / 100);
  }

  async function playGestureConfirmed(
    volumePercent: number,
    tone: "default" | "shutdown" = "default",
  ) {
    await playGestureTone(
      tone === "shutdown" ? "shutdown" : "confirmed",
      volumePercent / 100,
    );
  }

  async function playGestureTone(
    kind: "recognized" | "confirmed" | "shutdown",
    volume: number,
  ) {
    if (volume <= 0) return;
    await unlock();
    if (!audio) return;

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime;
    const confirmed = kind !== "recognized";
    const shutdown = kind === "shutdown";
    const duration = shutdown ? 0.32 : confirmed ? 0.18 : 0.08;
    const peakGain =
      (confirmed ? GESTURE_CONFIRMED_GAIN : GESTURE_RECOGNIZED_GAIN) * volume;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      shutdown ? 880 : confirmed ? 660 : 520,
      start,
    );
    if (shutdown) {
      oscillator.frequency.exponentialRampToValueAtTime(520, start + 0.14);
      oscillator.frequency.exponentialRampToValueAtTime(220, start + duration);
    } else if (confirmed) {
      oscillator.frequency.setValueAtTime(880, start + 0.08);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    disconnectOnEnd(oscillator, gain);
  }

  function playTone(volume: number) {
    if (!audio) return;

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, start);
    oscillator.frequency.exponentialRampToValueAtTime(430, start + 0.34);
    oscillator.frequency.exponentialRampToValueAtTime(600, start + 0.62);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(getAlertGain(volume), start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.72);
    disconnectOnEnd(oscillator, gain);
  }

  async function playAudioFile(
    choice: SoundChoiceId,
    path: string,
    volume: number,
  ) {
    if (!audio) return;

    try {
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      const start = audio.currentTime;
      source.buffer = await getAudioBuffer(choice, path);
      gain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), start);
      source.connect(gain);
      gain.connect(audio.destination);
      source.start(start);
      disconnectOnEnd(source, gain);
    } catch (error) {
      console.error("Failed to play notification sound.", error);
      playTone(volume);
    }
  }

  async function getAudioBuffer(choice: SoundChoiceId, path: string) {
    if (!audio) throw new Error("AudioContext is not ready.");
    const cachedBuffer = audioBuffers.get(choice);
    if (cachedBuffer) return cachedBuffer;

    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    const buffer = await audio.decodeAudioData(await response.arrayBuffer());
    audioBuffers.set(choice, buffer);
    return buffer;
  }

  return {
    playAlert,
    playGestureConfirmed,
    playGestureRecognized,
    unlock,
  };
}

function disconnectOnEnd(
  source: AudioScheduledSourceNode,
  gain: GainNode,
) {
  source.addEventListener("ended", () => {
    source.disconnect();
    gain.disconnect();
  });
}

function getAlertGain(volume: number) {
  if (volume <= 0.5) return BASE_ALERT_GAIN * (volume / 0.5);
  return (
    BASE_ALERT_GAIN +
    (MAX_ALERT_GAIN - BASE_ALERT_GAIN) * ((volume - 0.5) / 0.5)
  );
}
