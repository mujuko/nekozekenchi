import type { SoundService } from "../../app/sound/soundService";
import {
  DEFAULT_SOUND_CHOICE,
  isSoundChoiceId,
  type SoundChoiceId,
} from "../../app/sound/soundTypes";
import type { Messages } from "../../localization/messages";
import type { SoundSettingsElements } from "../shell/appElements";

type MessagesProvider = () => Messages;

export function createSoundSettingsController(
  elements: SoundSettingsElements,
  sound: SoundService,
  getMessages: MessagesProvider,
) {
  sound.subscribe(updateControls);

  function loadSettings() {
    sound.loadSettings();
  }

  function bindControls() {
    elements.soundButton.onclick = () => {
      void sound.playAlert();
    };
    elements.soundVolume.addEventListener("input", () => {
      sound.setVolume(Number(elements.soundVolume.value));
    });
    elements.muteButton.addEventListener("click", () => {
      if (sound.isMuted()) sound.unmute();
      else sound.mute();
    });
    elements.soundChoices.forEach((choice) => {
      choice.addEventListener("change", () => {
        const choices = getSelectedSoundChoices();
        sound.setChoices(
          choices.length > 0 ? choices : [DEFAULT_SOUND_CHOICE],
        );
      });
    });
  }

  function updateControls() {
    const t = getMessages();
    const settings = sound.getSettings();
    const muted = settings.volume <= 0;

    elements.soundVolume.value = String(settings.volume);
    elements.soundVolume.setAttribute("aria-valuetext", `${settings.volume}%`);
    elements.muteButton.classList.toggle("sound-settings__button--muted", muted);
    elements.muteButton.textContent = muted ? t.settings.unmute : t.settings.mute;
    elements.muteButton.setAttribute("aria-pressed", String(muted));
    elements.muteButton.setAttribute(
      "aria-label",
      muted ? t.settings.unmuteLabel : t.settings.muteLabel,
    );
    elements.soundChoices.forEach((choice) => {
      choice.checked = settings.choices.includes(choice.value as SoundChoiceId);
    });
  }

  function getSelectedSoundChoices() {
    return Array.from(elements.soundChoices)
      .filter((choice) => choice.checked)
      .map((choice) => choice.value)
      .filter(isSoundChoiceId);
  }

  return { bindControls, loadSettings, updateControls };
}
