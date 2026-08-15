import type { Locale } from "../../localization/locale";
import type { Messages } from "../../localization/messages";
import type { AppElements } from "./appElements";

export function updateAppLocale(
  appVersion: string,
  elements: AppElements,
  t: Messages,
  locale: Locale,
) {
  const { alert, displaySettings, monitoring, navigation, soundSettings } =
    elements;

  document.documentElement.lang = locale;
  document.title = t.meta.title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", t.meta.description);
  updateHeadLocale(t, locale);

  setText(".brand__name", t.common.brand);
  document.querySelector(".brand")?.setAttribute("aria-label", t.header.homeLabel);
  document
    .querySelector(".brand__version")
    ?.setAttribute("aria-label", t.header.versionLabel(appVersion));
  document
    .querySelector(".source-link")
    ?.setAttribute("aria-label", t.common.github);
  document.querySelector(".source-link")?.setAttribute("title", t.common.github);
  setText(".source-link span", t.common.sourceCode);
  navigation.menuButton?.setAttribute("aria-label", t.header.openMenu);

  document.querySelectorAll<HTMLSelectElement>("[data-locale-select]").forEach((select) => {
    select.value = locale;
    const jaOption = select.querySelector<HTMLOptionElement>('option[value="ja"]');
    const enOption = select.querySelector<HTMLOptionElement>('option[value="en"]');
    if (jaOption) jaOption.textContent = t.common.japanese;
    if (enOption) enOption.textContent = t.common.english;
  });
  document
    .querySelectorAll<HTMLSpanElement>(".language-picker > span")
    .forEach((label) => {
      label.textContent = t.common.language;
    });

  setText(".hero h1", "");
  const heroTitle = document.querySelector<HTMLHeadingElement>(".hero h1");
  if (heroTitle) {
    heroTitle.append(t.hero.titleLine1, document.createElement("br"));
    const emphasis = document.createElement("em");
    emphasis.textContent = t.hero.titleEmphasis;
    heroTitle.append(emphasis);
  }
  setText(".hero__copy", t.hero.copy);

  setText("#camera-placeholder h2", t.camera.placeholderTitle);
  setText("#camera-placeholder p", t.camera.placeholderCopy);
  monitoring.pauseButtonLabel.textContent = t.camera.pause;
  monitoring.calibrateButtonLabel.textContent = t.camera.recalibrate;
  alert.alertFlash.textContent = t.camera.alert;
  monitoring.gestureGuide.textContent = t.gesture.guide;

  navigation.mobileMenu.setAttribute("aria-label", t.settings.panelAria);
  setText(".settings-panel__header h2", t.settings.menuTitle);
  navigation.closeMenuButton?.setAttribute("aria-label", t.header.closeMenu);
  setText(".settings h2", t.settings.panelTitle);
  updateSettingRow("#sensitivity", t.settings.sensitivity, t.settings.sensitivityHelp);
  updateSelectOption(monitoring.sensitivity, "0.9", t.settings.sensitivityLoose);
  updateSelectOption(monitoring.sensitivity, "0.75", t.settings.sensitivityNormal);
  updateSelectOption(monitoring.sensitivity, "0.6", t.settings.sensitivitySensitive);
  updateSettingRow("#duration", t.settings.duration, t.settings.durationHelp);
  updateSelectOption(monitoring.duration, "2000", t.settings.seconds(2));
  updateSelectOption(monitoring.duration, "3000", t.settings.seconds(3));
  updateSelectOption(monitoring.duration, "5000", t.settings.seconds(5));

  const displaySetting = document.querySelector(".settings__row--display");
  displaySetting?.querySelector("b")?.replaceChildren(t.settings.display);
  displaySetting?.querySelector("small")?.replaceChildren(t.settings.displayHelp);
  displaySetting
    ?.querySelector(".choice-list--display")
    ?.setAttribute("aria-label", t.settings.displayLabel);
  const displayLabels = [
    t.settings.showVideo,
    t.settings.showPoseGuide,
    t.settings.showUprightLine,
    t.settings.showSlouchLine,
  ];
  displaySettings.displayChoices.forEach((choice, index) => {
    if (choice.parentElement?.lastChild) {
      choice.parentElement.lastChild.textContent = displayLabels[index];
    }
  });

  const soundSetting = document.querySelector(".settings__row--sound");
  soundSetting?.querySelector("b")?.replaceChildren(t.settings.sound);
  soundSetting?.querySelector("small")?.replaceChildren(t.settings.soundHelp);
  document
    .querySelector(".choice-list--sound")
    ?.setAttribute("aria-label", t.settings.soundKindLabel);
  const soundLabels = [
    t.settings.soundTone,
    t.settings.soundCat(1),
    t.settings.soundCat(2),
    t.settings.soundCat(3),
    t.settings.soundCat(4),
  ];
  soundSettings.soundChoices.forEach((choice, index) => {
    const label = choice.parentElement;
    if (label) label.lastChild!.textContent = soundLabels[index];
  });
  soundSettings.soundVolume.setAttribute("aria-label", t.settings.volumeLabel);
  soundSettings.soundButton.textContent = t.settings.testSound;
  soundSettings.soundButton.setAttribute("aria-label", t.settings.testSoundLabel);

  const tipParagraph = document.querySelector<HTMLParagraphElement>(".tip p");
  if (tipParagraph) {
    tipParagraph.replaceChildren();
    const title = document.createElement("b");
    title.textContent = t.tip.title;
    tipParagraph.append(title, t.tip.body);
  }

  document
    .querySelector(".settings-panel__links")
    ?.setAttribute("aria-label", t.common.brand);
  setText(".settings-panel__links > a:first-child span", t.common.sourceCode);
  setText(".settings-panel__links > a:nth-child(2)", t.common.soundCredit);
  setText(".settings-panel__links > span:last-child", t.common.copyright);
  setText(".app-footer span", t.common.copyright);
  setText(".app-footer a", t.common.soundCredit);
}

function setText(selector: string, text: string) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function updateSettingRow(selectSelector: string, title: string, help: string) {
  const row = document.querySelector(selectSelector)?.closest(".settings__row");
  row?.querySelector("b")?.replaceChildren(title);
  row?.querySelector("small")?.replaceChildren(help);
}

function updateSelectOption(select: HTMLSelectElement, value: string, text: string) {
  const option = select.querySelector<HTMLOptionElement>(
    `option[value="${value}"]`,
  );
  if (option) option.textContent = text;
}

function updateHeadLocale(t: Messages, locale: Locale) {
  const url = locale === "en" ? "https://nekoze.mujuko.com/en/" : "https://nekoze.mujuko.com/";
  const alternateName = locale === "en" ? "ねこ背検知" : "Nekozekenchi";

  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", url);
  setMetaContent('meta[property="og:site_name"]', t.common.brand);
  setMetaContent('meta[property="og:title"]', t.meta.title);
  setMetaContent('meta[property="og:description"]', t.meta.description);
  setMetaContent('meta[property="og:url"]', url);
  setMetaContent('meta[name="twitter:title"]', t.meta.title);
  setMetaContent('meta[name="twitter:description"]', t.meta.description);

  const schema = document.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  );
  if (schema) {
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t.common.brand,
      alternateName,
      url,
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      description: t.meta.description,
      inLanguage: locale === "en" ? ["en", "ja"] : ["ja", "en"],
      isAccessibleForFree: true,
      softwareHelp: "https://github.com/mujuko/nekozekenchi",
    });
  }
}

function setMetaContent(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
}
