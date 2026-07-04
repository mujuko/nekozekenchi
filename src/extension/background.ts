import { getMessages } from "../i18n";
import {
  DEFAULT_EXTENSION_SETTINGS,
  IDLE_SNAPSHOT,
  type BackgroundToOffscreenMessage,
  type BackgroundToPopupMessage,
  type ExtensionSettings,
  type MonitoringSnapshot,
  type OffscreenToBackgroundMessage,
  type PopupToBackgroundMessage,
} from "./messages";

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const NOTIFICATION_ICON_PATH = "icons/icon-128.png";

let creatingOffscreenDocument: Promise<void> | null = null;
let popupPort: ChromeRuntimePort | null = null;
let lastSnapshot: MonitoringSnapshot = IDLE_SNAPSHOT;
let lastSettings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "popup") return;

  popupPort = port;
  postToPopup({ type: "STATUS_UPDATE", snapshot: lastSnapshot });
  void sendToOffscreenIfPresent({
    target: "offscreen",
    type: "SET_PREVIEW_ACTIVE",
    active: true,
  });

  port.onMessage.addListener((message) => {
    if (!isPopupToBackgroundMessage(message)) return;
    void handlePopupMessage(message);
  });

  port.onDisconnect.addListener(() => {
    if (popupPort !== port) return;
    popupPort = null;
    void sendToOffscreenIfPresent({
      target: "offscreen",
      type: "SET_PREVIEW_ACTIVE",
      active: false,
    });
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (!isOffscreenToBackgroundMessage(message)) return;
  void handleOffscreenMessage(message);
});

async function handlePopupMessage(message: PopupToBackgroundMessage) {
  if (message.type === "GET_STATUS") {
    postToPopup({ type: "STATUS_UPDATE", snapshot: lastSnapshot });
    return;
  }

  if (message.type === "START_MONITORING") {
    lastSettings = message.settings;
    await ensureOffscreenDocument();
    if (popupPort) {
      await chrome.runtime.sendMessage({
        target: "offscreen",
        type: "SET_PREVIEW_ACTIVE",
        active: true,
      } satisfies BackgroundToOffscreenMessage);
    }
    await chrome.runtime.sendMessage({
      target: "offscreen",
      type: "START_MONITORING",
      settings: lastSettings,
    } satisfies BackgroundToOffscreenMessage);
    await setBadge("...");
    return;
  }

  if (message.type === "STOP_MONITORING") {
    await sendToOffscreenIfPresent({
      target: "offscreen",
      type: "STOP_MONITORING",
    });
    await closeOffscreenDocument();
    lastSnapshot = IDLE_SNAPSHOT;
    postToPopup({ type: "STATUS_UPDATE", snapshot: lastSnapshot });
    await setBadge("");
    return;
  }

  if (message.type === "BEGIN_CALIBRATION") {
    await sendToOffscreenIfPresent({
      target: "offscreen",
      type: "BEGIN_CALIBRATION",
    });
    return;
  }

  if (message.type === "UPDATE_SETTINGS") {
    lastSettings = message.settings;
    await sendToOffscreenIfPresent({
      target: "offscreen",
      type: "UPDATE_SETTINGS",
      settings: lastSettings,
    });
  }
}

async function handleOffscreenMessage(message: OffscreenToBackgroundMessage) {
  if (message.type === "STATUS_UPDATE") {
    lastSnapshot = message.snapshot;
    postToPopup({ type: "STATUS_UPDATE", snapshot: lastSnapshot });
    await setBadge(message.snapshot.monitoring ? "ON" : "");
    return;
  }

  if (message.type === "PREVIEW_FRAME") {
    postToPopup({ type: "PREVIEW_FRAME", dataUrl: message.dataUrl });
    return;
  }

  if (message.type === "BAD_POSTURE_ALERT") {
    await notifyBadPosture();
    return;
  }

  if (message.type === "OFFSCREEN_STOPPED") {
    lastSnapshot = IDLE_SNAPSHOT;
    postToPopup({ type: "STATUS_UPDATE", snapshot: lastSnapshot });
    await setBadge("");
  }
}

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (contexts.length > 0) return;
  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
    return;
  }

  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["USER_MEDIA"],
    justification: "Webカメラで姿勢を継続的に監視するため",
  });

  try {
    await creatingOffscreenDocument;
  } finally {
    creatingOffscreenDocument = null;
  }
}

async function closeOffscreenDocument() {
  try {
    await chrome.offscreen.closeDocument();
  } catch {
    // Already closed or never opened.
  }
}

async function sendToOffscreenIfPresent(message: BackgroundToOffscreenMessage) {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (contexts.length === 0) return;

  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // The offscreen document may have closed between the context check and send.
  }
}

function postToPopup(message: BackgroundToPopupMessage) {
  try {
    popupPort?.postMessage(message);
  } catch {
    popupPort = null;
  }
}

async function notifyBadPosture() {
  const t = getMessages("ja");
  await chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON_PATH),
    title: t.notification.title,
    message: t.notification.body,
  });
}

async function setBadge(text: string) {
  await chrome.action.setBadgeText({ text });
  if (text) await chrome.action.setBadgeBackgroundColor({ color: "#cf7420" });
}

function isPopupToBackgroundMessage(
  message: unknown,
): message is PopupToBackgroundMessage {
  if (!isMessageRecord(message) || message.target !== "background")
    return false;
  return [
    "GET_STATUS",
    "START_MONITORING",
    "STOP_MONITORING",
    "BEGIN_CALIBRATION",
    "UPDATE_SETTINGS",
  ].includes(String(message.type));
}

function isOffscreenToBackgroundMessage(
  message: unknown,
): message is OffscreenToBackgroundMessage {
  if (!isMessageRecord(message) || message.target !== "background")
    return false;
  return [
    "STATUS_UPDATE",
    "PREVIEW_FRAME",
    "BAD_POSTURE_ALERT",
    "OFFSCREEN_STOPPED",
  ].includes(String(message.type));
}

function isMessageRecord(message: unknown): message is Record<string, unknown> {
  return typeof message === "object" && message !== null;
}
