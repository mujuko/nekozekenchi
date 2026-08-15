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

  setText(".header-brand__name", t.common.brand);
  document
    .querySelector(".header-brand")
    ?.setAttribute("aria-label", t.header.homeLabel);
  setText(".app-tagline", t.header.tagline);
  document
    .querySelector(".app-footer__version")
    ?.setAttribute("aria-label", t.header.versionLabel(appVersion));
  setText(".app-footer__source-link span", t.common.sourceCode);
  navigation.menuButton?.setAttribute("aria-label", t.header.openMenu);

  document.querySelectorAll<HTMLSelectElement>("[data-locale-select]").forEach((select) => {
    select.value = locale;
    select.setAttribute("aria-label", t.common.language);
    const jaOption = select.querySelector<HTMLOptionElement>('option[value="ja"]');
    const enOption = select.querySelector<HTMLOptionElement>('option[value="en"]');
    if (jaOption) jaOption.textContent = t.common.japanese;
    if (enOption) enOption.textContent = t.common.english;
  });
  document
    .querySelectorAll<HTMLSpanElement>(".language-picker__label")
    .forEach((label) => {
      label.textContent = t.common.language;
    });

  setText("#camera-placeholder h2", t.camera.placeholderTitle);
  setText("#camera-placeholder p", t.camera.placeholderCopy);
  monitoring.pauseButtonLabel.textContent = t.camera.pause;
  monitoring.calibrateButtonLabel.textContent = t.camera.recalibrate;
  alert.alertFlash.textContent = t.camera.alert;
  document
    .querySelectorAll<HTMLElement>("[data-gesture-guide-title]")
    .forEach((title) => {
      title.textContent = t.gesture.guideTitle;
    });
  monitoring.gestureGuides.forEach((guide) => {
    guide.replaceChildren(
      ...t.gesture.guideItems.map((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        return listItem;
      }),
    );
  });

  navigation.mobileMenu.setAttribute("aria-label", t.settings.panelAria);
  setText(".settings-panel__header h2", t.settings.menuTitle);
  navigation.closeMenuButton?.setAttribute("aria-label", t.header.closeMenu);
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

  setText(".app-footer__product-name", t.common.brand);
  document
    .querySelector<HTMLImageElement>(".app-footer__company-logo")
    ?.setAttribute("alt", t.common.company);
  setText(".app-footer__product p", t.footer.summary);
  setText(".app-footer__sound-credit span", t.common.soundCredit);
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
