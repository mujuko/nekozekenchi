import "./popup.css";
import {
  DEFAULT_EXTENSION_SETTINGS,
  IDLE_SNAPSHOT,
  type BackgroundToPopupMessage,
  type ExtensionSettings,
  type MonitoringSnapshot,
  type PopupToBackgroundMessage,
} from "./messages";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app was not found.");

app.innerHTML = `
  <main class="popup-shell">
    <header class="popup-header">
      <div class="brand-mark" aria-hidden="true">
        <span class="ear ear-left"></span><span class="ear ear-right"></span>
        <span class="face-dot face-dot-left"></span><span class="face-dot face-dot-right"></span>
      </div>
      <div>
        <h1>ねこ検知</h1>
        <p>閉じても見守りを続けます</p>
      </div>
    </header>

    <section class="preview-card">
      <img id="preview" alt="カメラの位置調整プレビュー" />
      <div class="preview-placeholder" id="preview-placeholder">
        <strong>プレビュー待機中</strong>
        <span>開始すると位置調整用の映像が表示されます</span>
      </div>
      <div class="status-chip" id="status-chip">停止中</div>
    </section>

    <section class="metric-card">
      <div class="metric-head">
        <strong id="status-label">停止中</strong>
        <span id="score-label">0%</span>
      </div>
      <div class="meter-track"><div id="meter-fill" class="meter-fill"></div></div>
      <p id="message">停止中です。開始するとカメラで姿勢を見守ります。</p>
    </section>

    <section class="controls">
      <button class="primary" id="toggle-button" type="button">見守り開始</button>
      <button class="secondary" id="calibrate-button" type="button" disabled>再調整</button>
    </section>

    <section class="settings-card">
      <label>
        <span>感度</span>
        <select id="sensitivity">
          <option value="0.9">ゆるめ</option>
          <option value="0.75" selected>ふつう</option>
          <option value="0.6">敏感</option>
        </select>
      </label>
      <label>
        <span>お知らせまで</span>
        <select id="duration">
          <option value="2000">2秒</option>
          <option value="3000" selected>3秒</option>
          <option value="5000">5秒</option>
        </select>
      </label>
    </section>
  </main>
`;

const preview = query<HTMLImageElement>("#preview");
const previewPlaceholder = query<HTMLDivElement>("#preview-placeholder");
const statusChip = query<HTMLDivElement>("#status-chip");
const statusLabel = query<HTMLElement>("#status-label");
const scoreLabel = query<HTMLSpanElement>("#score-label");
const meterFill = query<HTMLDivElement>("#meter-fill");
const message = query<HTMLParagraphElement>("#message");
const toggleButton = query<HTMLButtonElement>("#toggle-button");
const calibrateButton = query<HTMLButtonElement>("#calibrate-button");
const sensitivity = query<HTMLSelectElement>("#sensitivity");
const duration = query<HTMLSelectElement>("#duration");

const port = chrome.runtime.connect({ name: "popup" });
let currentSnapshot: MonitoringSnapshot = IDLE_SNAPSHOT;

port.onMessage.addListener((rawMessage) => {
  if (!isBackgroundToPopupMessage(rawMessage)) return;

  if (rawMessage.type === "STATUS_UPDATE") {
    currentSnapshot = rawMessage.snapshot;
    renderStatus(rawMessage.snapshot);
    return;
  }

  if (rawMessage.type === "PREVIEW_FRAME") {
    preview.src = rawMessage.dataUrl;
    preview.classList.add("visible");
    previewPlaceholder.hidden = true;
    return;
  }

  if (rawMessage.type === "ERROR") {
    message.textContent = rawMessage.message;
  }
});

port.postMessage({
  target: "background",
  type: "GET_STATUS",
} satisfies PopupToBackgroundMessage);

toggleButton.addEventListener("click", () => {
  void handleToggleMonitoring();
});

calibrateButton.addEventListener("click", () => {
  port.postMessage({
    target: "background",
    type: "BEGIN_CALIBRATION",
  } satisfies PopupToBackgroundMessage);
});

[sensitivity, duration].forEach((select) => {
  select.addEventListener("change", () => {
    port.postMessage({
      target: "background",
      type: "UPDATE_SETTINGS",
      settings: readSettings(),
    } satisfies PopupToBackgroundMessage);
  });
});

async function handleToggleMonitoring() {
  if (currentSnapshot.monitoring) {
    port.postMessage({
      target: "background",
      type: "STOP_MONITORING",
    } satisfies PopupToBackgroundMessage);
    return;
  }

  toggleButton.disabled = true;
  message.textContent = "カメラの許可を確認しています...";

  try {
    await requestCameraGrant();
    port.postMessage({
      target: "background",
      type: "START_MONITORING",
      settings: readSettings(),
    } satisfies PopupToBackgroundMessage);
  } catch (error) {
    message.textContent = getCameraPermissionMessage(error);
  } finally {
    toggleButton.disabled = false;
  }
}

async function requestCameraGrant() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  stream.getTracks().forEach((track) => track.stop());
}

function getCameraPermissionMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "カメラの利用が許可されませんでした。Chromeのカメラ設定で、この拡張機能のブロックを解除してから再読み込みしてください。";
    }
    if (error.name === "NotFoundError") {
      return "利用できるカメラが見つかりませんでした。";
    }
    if (error.name === "NotReadableError") {
      return "カメラを使用できません。他のアプリがカメラを使っていないか確認してください。";
    }
  }

  return error instanceof Error
    ? error.message
    : "カメラの起動中にエラーが発生しました。";
}

function renderStatus(snapshot: MonitoringSnapshot) {
  const statusText = getStatusText(snapshot);
  const progress = Math.max(0.04, Math.min(1, snapshot.score));

  document.body.dataset.status = snapshot.status;
  statusChip.textContent = statusText;
  statusLabel.textContent = statusText;
  scoreLabel.textContent = `${Math.round(snapshot.score * 100)}%`;
  meterFill.style.width = `${progress * 100}%`;
  message.textContent = snapshot.message;
  toggleButton.textContent = snapshot.monitoring ? "見守り停止" : "見守り開始";
  toggleButton.classList.toggle("stop", snapshot.monitoring);
  calibrateButton.disabled = !snapshot.monitoring;

  if (!snapshot.monitoring) {
    preview.classList.remove("visible");
    previewPlaceholder.hidden = false;
  }
}

function getStatusText(snapshot: MonitoringSnapshot) {
  if (snapshot.status === "starting") return "起動中";
  if (snapshot.status === "calibrating") return "調整中";
  if (snapshot.status === "watching") return "見守り中";
  if (snapshot.status === "missing") return "検出待ち";
  if (snapshot.status === "good") return "いい姿勢";
  if (snapshot.status === "bad") return "猫背を検知";
  if (snapshot.status === "error") return "エラー";
  return "停止中";
}

function readSettings(): ExtensionSettings {
  return {
    sensitivity:
      Number(sensitivity.value) || DEFAULT_EXTENSION_SETTINGS.sensitivity,
    warningDurationMs:
      Number(duration.value) || DEFAULT_EXTENSION_SETTINGS.warningDurationMs,
  };
}

function query<T extends HTMLElement>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`${selector} was not found.`);
  return element;
}

function isBackgroundToPopupMessage(
  message: unknown,
): message is BackgroundToPopupMessage {
  if (typeof message !== "object" || message === null) return false;
  return ["STATUS_UPDATE", "PREVIEW_FRAME", "ERROR"].includes(
    String((message as Record<string, unknown>).type),
  );
}
