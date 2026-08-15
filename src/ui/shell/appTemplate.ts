import type { Locale } from "../../localization/locale";
import type { Messages } from "../../localization/messages";
import catRelaxedUrl from "../assets/cat-relaxed.svg";
import logotypeUrl from "../assets/logotype.svg";

export function renderApp(appVersion: string, t: Messages, locale: Locale) {
  return `
    <main class="app">
      <header class="app-header">
        <a class="header-brand" href="#" aria-label="${t.header.homeLabel}">
          <img class="header-brand__mark" data-cat-icon src="${catRelaxedUrl}" alt="">
          <span class="header-brand__name">${t.common.brand}</span>
        </a>
        ${languageSelect(t, locale, "header")}
      </header>
      <p class="app-tagline">${t.header.tagline}</p>
      <section class="workspace">
        <div class="monitor-column">
          <div class="camera">
          <div class="camera__heading"><span class="section-label">01 / MONITOR</span></div>
          <div class="camera__stage" id="camera-stage">
            <button class="camera__menu-toggle menu-toggle dads-hamburger-menu-button mobile-only" id="menu-button" type="button" aria-label="${t.header.openMenu}" aria-controls="mobile-menu" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
            <video class="camera__video" id="video" playsinline muted></video>
            <canvas class="camera__overlay" id="overlay"></canvas>
            <div class="camera__placeholder" id="camera-placeholder">
              <div class="camera__cat-orbit">
                <img class="camera__cat" data-cat-icon src="${catRelaxedUrl}" alt="">
              </div>
              <h2>${t.camera.placeholderTitle}</h2>
              <p>${t.camera.placeholderCopy}</p>
            </div>
            <div class="calibration" id="calibration-overlay" hidden>
              <div class="calibration__countdown"><span id="countdown">3</span></div>
              <strong id="calibration-title">${t.calibration.goodTitle}</strong>
              <small id="calibration-help">${t.calibration.goodHelp}</small>
            </div>
            <div class="status-pill" id="status-pill" hidden>
              <span class="status-pill__indicator"></span><b id="status-label">${t.camera.statusMeasuring}</b>
            </div>
            <div class="gesture-feedback" id="gesture-feedback" role="status" hidden>
              <b id="gesture-feedback-label"></b>
              <span class="gesture-feedback__progress"><i class="gesture-feedback__progress-bar" id="gesture-progress-bar"></i></span>
            </div>
            ${posturePanel(t)}
            <div class="alert" id="alert-flash" hidden>${t.camera.alert}</div>
          </div>
          <div class="camera__actions">
            <button class="button button--primary button--start dads-button" data-type="solid-fill" data-size="lg" id="start-button">
              <svg class="button__icon" aria-hidden="true" viewBox="0 0 24 24">
                <rect x="3" y="6" width="13" height="12" rx="2"></rect>
                <path d="m16 10 5-3v10l-5-3Z"></path>
              </svg>
              <span id="start-button-label">${t.camera.start}</span>
            </button>
            <button class="button button--secondary dads-button" data-type="outline" data-size="lg" id="pause-button" type="button" disabled>
              <svg class="button__icon" id="pause-button-pause-icon" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 5v14"></path>
                <path d="M16 5v14"></path>
              </svg>
              <svg class="button__icon" id="pause-button-resume-icon" aria-hidden="true" viewBox="0 0 24 24" hidden>
                <path d="m8 5 11 7-11 7Z"></path>
              </svg>
              <span id="pause-button-label">${t.camera.pause}</span>
            </button>
            <button class="button button--secondary dads-button" data-type="outline" data-size="lg" id="calibrate-button" disabled>
              <svg class="button__icon" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"></path>
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"></path>
              </svg>
              <span id="calibrate-button-label">${t.camera.recalibrate}</span>
            </button>
          </div>
          </div>
          ${gestureGuide(t, "desktop")}
        </div>

        <div class="drawer-scrim mobile-only" id="menu-scrim" hidden></div>
        <aside class="settings-panel" id="mobile-menu" aria-label="${t.settings.panelAria}">
          <div class="settings-panel__header mobile-only">
            <div><h2>${t.settings.menuTitle}</h2></div>
            <button class="settings-panel__close dads-button" data-type="text" data-size="sm" id="close-menu-button" type="button" aria-label="${t.header.closeMenu}">×</button>
          </div>
          ${settingsPanel(t)}
          ${gestureGuide(t, "mobile")}
        </aside>
      </section>

    </main>
    <footer class="app-footer">
      <div class="app-footer__inner">
        <div class="app-footer__main">
          <section class="app-footer__product">
            <span class="app-footer__label">PRODUCT</span>
            <div class="app-footer__product-body">
              <div>
                <strong class="app-footer__credit">
                  <span class="app-footer__product-name">${t.common.brand}</span>
                </strong>
                <p>${t.footer.summary}</p>
              </div>
            </div>
          </section>
          <nav class="app-footer__section" aria-label="${t.common.github}">
            <span class="app-footer__label">PROJECT</span>
            <a class="app-footer__link app-footer__source-link" href="https://github.com/mujuko/nekozekenchi" target="_blank" rel="noreferrer">
              ${externalLinkIcon()}<span>${t.common.sourceCode}</span>
            </a>
          </nav>
          <section class="app-footer__section">
            <span class="app-footer__label">CREDITS</span>
            <a class="app-footer__link app-footer__sound-credit" href="https://pocket-se.info/" target="_blank" rel="noreferrer">
              ${externalLinkIcon()}<span>${t.common.soundCredit}</span>
            </a>
          </section>
        </div>
        <div class="app-footer__bottom">
          <img class="app-footer__company-logo" src="${logotypeUrl}" alt="${t.common.company}">
          <span class="app-footer__version" aria-label="${t.header.versionLabel(appVersion)}">${appVersion}</span>
        </div>
      </div>
    </footer>
  `;
}

function posturePanel(t: Messages) {
  return `
    <div class="posture-status">
      <div class="posture-status__meter">
        <div class="posture-status__track"><div class="posture-status__fill" data-meter-fill></div></div>
      </div>
      <div class="posture-status__badge posture-status__badge--idle" data-posture-badge>${t.posture.idleBadge}</div>
    </div>
  `;
}

function settingsPanel(t: Messages) {
  return `
    <div class="settings">
      <div class="settings__heading">
        <span class="section-label">02 / CONTROL</span>
      </div>
      <label class="settings__row">
        <span><b>${t.settings.sensitivity}</b><small>${t.settings.sensitivityHelp}</small></span>
        <select class="dads-select" id="sensitivity">
          <option value="0.9">${t.settings.sensitivityLoose}</option>
          <option value="0.75" selected>${t.settings.sensitivityNormal}</option>
          <option value="0.6">${t.settings.sensitivitySensitive}</option>
        </select>
      </label>
      <label class="settings__row">
        <span><b>${t.settings.duration}</b><small>${t.settings.durationHelp}</small></span>
        <select class="dads-select" id="duration">
          <option value="2000">${t.settings.seconds(2)}</option>
          <option value="3000" selected>${t.settings.seconds(3)}</option>
          <option value="5000">${t.settings.seconds(5)}</option>
        </select>
      </label>
      <div class="settings__row settings__row--display">
        <span><b>${t.settings.display}</b><small>${t.settings.displayHelp}</small></span>
        <div class="choice-list choice-list--display" aria-label="${t.settings.displayLabel}">
          <label><input type="checkbox" value="video" data-display-choice checked>${t.settings.showVideo}</label>
          <label><input type="checkbox" value="poseGuide" data-display-choice>${t.settings.showPoseGuide}</label>
          <label><input type="checkbox" value="uprightLine" data-display-choice>${t.settings.showUprightLine}</label>
          <label><input type="checkbox" value="slouchLine" data-display-choice checked>${t.settings.showSlouchLine}</label>
        </div>
      </div>
      <div class="settings__row settings__row--sound">
        <span><b>${t.settings.sound}</b><small>${t.settings.soundHelp}</small></span>
        <div class="sound-settings">
          <div class="choice-list choice-list--sound" aria-label="${t.settings.soundKindLabel}">
            <label><input type="checkbox" value="tone" data-sound-choice>${t.settings.soundTone}</label>
            <label><input type="checkbox" value="cat10" data-sound-choice checked>${t.settings.soundCat(1)}</label>
            <label><input type="checkbox" value="cat11" data-sound-choice checked>${t.settings.soundCat(2)}</label>
            <label><input type="checkbox" value="cat15" data-sound-choice checked>${t.settings.soundCat(3)}</label>
            <label><input type="checkbox" value="cat30" data-sound-choice checked>${t.settings.soundCat(4)}</label>
          </div>
          <div class="sound-settings__volume">
            <button class="sound-settings__button sound-settings__button--mute dads-button" data-type="outline" data-size="sm" id="mute-button" type="button" aria-pressed="false" aria-label="${t.settings.muteLabel}">${t.settings.mute}</button>
            <input id="sound-volume" type="range" min="0" max="100" step="5" value="50" aria-label="${t.settings.volumeLabel}">
          </div>
          <button class="sound-settings__button sound-settings__button--test dads-button" data-type="outline" data-size="sm" id="sound-button" type="button" aria-label="${t.settings.testSoundLabel}">${t.settings.testSound}</button>
        </div>
      </div>
    </div>
  `;
}

function languageSelect(t: Messages, locale: Locale, placement: string) {
  return `
    <label class="language-picker language-picker--${placement}">
      <svg class="language-picker__icon" aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"></path>
      </svg>
      <span class="language-picker__label">${t.common.language}</span>
      <select data-locale-select aria-label="${t.common.language}">
        <option value="ja"${locale === "ja" ? " selected" : ""}>${t.common.japanese}</option>
        <option value="en"${locale === "en" ? " selected" : ""}>${t.common.english}</option>
      </select>
    </label>
  `;
}

function gestureGuide(t: Messages, placement: "desktop" | "mobile") {
  return `
    <section class="gesture-guide gesture-guide--${placement} ${placement}-only" aria-labelledby="gesture-guide-title-${placement}">
      <strong id="gesture-guide-title-${placement}" data-gesture-guide-title>${t.gesture.guideTitle}</strong>
      <ul data-gesture-guide>${t.gesture.guideItems.map((item) => `<li>${item}</li>`).join("")}</ul>
    </section>
  `;
}

function externalLinkIcon() {
  return `
    <svg class="external-link-icon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 4h6v6M20 4l-9 9"></path>
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"></path>
    </svg>
  `;
}
