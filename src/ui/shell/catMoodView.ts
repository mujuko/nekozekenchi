import catRelaxedUrl from "../assets/cat-relaxed.svg";
import catTriggeredUrl from "../assets/cat-triggered.svg";
import type { MonitoringElements } from "./appElements";

export type CatMood = "relaxed" | "triggered";

export function setCatMood(elements: MonitoringElements, mood: CatMood) {
  const src = mood === "triggered" ? catTriggeredUrl : catRelaxedUrl;
  elements.catIcons.forEach((icon) => {
    icon.src = src;
  });
}
