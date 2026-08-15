import type { Locale } from "../../localization/locale";
import type { Messages } from "../../localization/messages";
import catRelaxedUrl from "../assets/cat-relaxed.svg";

export function renderApp(appVersion: string, t: Messages, locale: Locale) {
  return `
    <main class="app">
      <header class="app-header">
        <a class="brand" href="#" aria-label="${t.header.homeLabel}">
          <img class="brand__mark" data-cat-icon src="${catRelaxedUrl}" alt="">
          <span class="brand__name">${t.common.brand}</span>
          <span class="brand__version" aria-label="${t.header.versionLabel(appVersion)}">${appVersion}</span>
        </a>
        <div class="app-header__actions desktop-only">
          ${languageSelect(t, locale, "desktop")}
          <a class="source-link" href="https://github.com/mujuko/nekozekenchi" target="_blank" rel="noreferrer" aria-label="${t.common.github}" title="${t.common.github}">
            ${githubIcon()}<span>${t.common.sourceCode}</span>
          </a>
        </div>
        <button class="menu-toggle dads-hamburger-menu-button mobile-only" id="menu-button" type="button" aria-label="${t.header.openMenu}" aria-controls="mobile-menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </header>

      <section class="hero desktop-only">
        <div>
          <h1>${t.hero.titleLine1}<br><em>${t.hero.titleEmphasis}</em></h1>
        </div>
        <p class="hero__copy">${t.hero.copy}</p>
      </section>

      <section class="workspace">
        <div class="camera">
          <div class="camera__stage" id="camera-stage">
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
                <path d="M14.5 4.5 16.2 7H20a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.8l1.7-2.5h5Z"></path>
                <circle cx="12" cy="13" r="4"></circle>
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
          <p class="camera__gesture-guide" id="gesture-guide">${t.gesture.guide}</p>
        </div>

        <div class="drawer-scrim mobile-only" id="menu-scrim" hidden></div>
        <aside class="settings-panel" id="mobile-menu" aria-label="${t.settings.panelAria}">
          <div class="settings-panel__header mobile-only">
            <div><h2>${t.settings.menuTitle}</h2></div>
            <button class="settings-panel__close dads-button" data-type="text" data-size="sm" id="close-menu-button" type="button" aria-label="${t.header.closeMenu}">×</button>
          </div>
          <div class="mobile-only">${languageSelect(t, locale, "mobile")}</div>
          ${settingsPanel(t)}
          <div class="tip">
            <span class="tip__icon">i</span>
            <p><b>${t.tip.title}</b>${t.tip.body}</p>
          </div>
          <nav class="settings-panel__links mobile-only" aria-label="${t.common.brand}">
            <a href="https://github.com/mujuko/nekozekenchi" target="_blank" rel="noreferrer">${githubIcon()}<span>${t.common.sourceCode}</span></a>
            <a href="https://pocket-se.info/" target="_blank" rel="noreferrer">${t.common.soundCredit}</a>
            <span>${t.common.copyright}</span>
          </nav>
        </aside>
      </section>

      <footer class="app-footer desktop-only">
        <span>${t.common.copyright}</span>
        <a href="https://pocket-se.info/" target="_blank" rel="noreferrer">${t.common.soundCredit}</a>
      </footer>
    </main>
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
      <h2>${t.settings.panelTitle}</h2>
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
          <label><input type="checkbox" value="poseGuide" data-display-choice checked>${t.settings.showPoseGuide}</label>
          <label><input type="checkbox" value="uprightLine" data-display-choice checked>${t.settings.showUprightLine}</label>
          <label><input type="checkbox" value="slouchLine" data-display-choice checked>${t.settings.showSlouchLine}</label>
        </div>
      </div>
      <div class="settings__row settings__row--sound">
        <span><b>${t.settings.sound}</b><small>${t.settings.soundHelp}</small></span>
        <div class="sound-settings">
          <div class="choice-list choice-list--sound" aria-label="${t.settings.soundKindLabel}">
            <label><input type="checkbox" value="tone" data-sound-choice checked>${t.settings.soundTone}</label>
            <label><input type="checkbox" value="cat10" data-sound-choice>${t.settings.soundCat(1)}</label>
            <label><input type="checkbox" value="cat11" data-sound-choice>${t.settings.soundCat(2)}</label>
            <label><input type="checkbox" value="cat15" data-sound-choice>${t.settings.soundCat(3)}</label>
            <label><input type="checkbox" value="cat30" data-sound-choice>${t.settings.soundCat(4)}</label>
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
      <span>${t.common.language}</span>
      <select data-locale-select>
        <option value="ja"${locale === "ja" ? " selected" : ""}>${t.common.japanese}</option>
        <option value="en"${locale === "en" ? " selected" : ""}>${t.common.english}</option>
      </select>
    </label>
  `;
}

function githubIcon() {
  return `
    <svg class="github-icon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.07c-3.13.68-3.8-1.34-3.8-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 .1 2.64-.89 3.28-.68.1-.73.4-1.23.72-1.52-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.99 0 0 .95-.3 3.1 1.16a10.7 10.7 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.56.23 2.71.11 2.99.72.79 1.16 1.8 1.16 3.03 0 4.33-2.63 5.28-5.14 5.56.41.35.77 1.04.77 2.09v3.1c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"></path>
    </svg>
  `;
}
