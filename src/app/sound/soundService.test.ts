import { describe, expect, it, vi } from "vitest";
import { createSoundService, type AudioOutput } from "./soundService";
import type { SoundPreferences } from "./soundTypes";

function setup(initial: SoundPreferences) {
  const output: AudioOutput = {
    unlock: vi.fn(async () => undefined),
    playAlert: vi.fn(async () => undefined),
    playGestureRecognized: vi.fn(async () => undefined),
    playGestureConfirmed: vi.fn(async () => undefined),
  };
  let saved: SoundPreferences | undefined;
  const service = createSoundService(output, {
    load: () => initial,
    save: (preferences) => {
      saved = preferences;
    },
  });
  service.loadSettings();
  return { getSaved: () => saved, output, service };
}

describe("SoundService", () => {
  it("restores the last audible volume after muting", () => {
    const { service } = setup({
      volume: 35,
      lastAudibleVolume: 35,
      choices: ["tone"],
    });

    service.mute();
    expect(service.isMuted()).toBe(true);
    service.unmute();

    expect(service.getSettings().volume).toBe(35);
  });

  it("persists normalized volume changes", () => {
    const { getSaved, service } = setup({
      volume: 50,
      lastAudibleVolume: 50,
      choices: ["tone"],
    });

    service.setVolume(53);

    expect(getSaved()).toMatchObject({ volume: 55, lastAudibleVolume: 55 });
  });

  it("passes the selected sound and volume to the audio output", async () => {
    const { output, service } = setup({
      volume: 40,
      lastAudibleVolume: 40,
      choices: ["cat10"],
    });

    await service.playAlert();

    expect(output.playAlert).toHaveBeenCalledWith("cat10", 40);
  });
});
