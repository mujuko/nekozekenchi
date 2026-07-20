import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distIndexPath = resolve(rootDir, "dist/index.html");
const enIndexPath = resolve(rootDir, "dist/en/index.html");

const ja = {
  lang: "ja",
  title: "ねこ背検知 - 猫背みまもり",
  siteName: "ねこ背検知",
  url: "https://nekoze.mujuko.com/",
  description:
    "猫背を音で知らせる完全オンデバイスなWebアプリ。映像は外部に送信せず、端末内だけで姿勢を判定します。",
  schemaName: "ねこ背検知",
  schemaAlternateName: "Nekozekenchi",
  noscriptTitle: "ねこ背検知 - 猫背みまもり",
  noscriptBody:
    "ねこ背検知は、カメラで姿勢を見守り、猫背が続いたときに音で知らせるWebアプリです。カメラ映像は送信されず、端末内だけで姿勢を判定します。",
};

const en = {
  lang: "en",
  title: "Nekozekenchi - Posture Watcher",
  siteName: "Nekozekenchi",
  url: "https://nekoze.mujuko.com/en/",
  description:
    "A fully on-device web app that alerts you when you slouch. Camera video is never sent externally; posture detection runs only on your device.",
  schemaName: "Nekozekenchi",
  schemaAlternateName: "ねこ背検知",
  noscriptTitle: "Nekozekenchi - Posture Watcher",
  noscriptBody:
    "Nekozekenchi watches your posture with your camera and plays a sound when you keep slouching. Camera video is never sent externally; posture detection runs only on your device.",
};

let html = await readFile(distIndexPath, "utf8");
html = localizeHtml(html, ja, en);

await mkdir(dirname(enIndexPath), { recursive: true });
await writeFile(enIndexPath, html);

function localizeHtml(html, from, to) {
  let localized = html;

  localized = replaceAll(localized, `<html lang="${from.lang}">`, `<html lang="${to.lang}">`);
  localized = replaceAll(localized, `content="${from.description}"`, `content="${to.description}"`);
  localized = replaceAll(localized, `content="${from.siteName}"`, `content="${to.siteName}"`);
  localized = replaceAll(localized, `content="${from.title}"`, `content="${to.title}"`);
  localized = replaceAll(localized, `content="${from.url}"`, `content="${to.url}"`);
  localized = replaceAll(
    localized,
    `<link rel="canonical" href="${from.url}" />`,
    `<link rel="canonical" href="${to.url}" />`,
  );
  localized = replaceAll(localized, `<title>${from.title}</title>`, `<title>${to.title}</title>`);

  localized = replaceSchema(localized, from, to);
  localized = replaceNoscript(localized, to);

  return localized;
}

function replaceSchema(html, from, to) {
  return html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "${to.schemaName}",
        "alternateName": "${to.schemaAlternateName}",
        "url": "${to.url}",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web",
        "description": "${to.description}",
        "inLanguage": ["${to.lang}", "${from.lang}"],
        "isAccessibleForFree": true,
        "softwareHelp": "https://github.com/mujuko/nekozekenchi"
      }
    </script>`,
  );
}

function replaceNoscript(html, locale) {
  return html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>
      <main>
        <h1>${locale.noscriptTitle}</h1>
        <p>${locale.noscriptBody}</p>
      </main>
    </noscript>`,
  );
}

function replaceAll(value, search, replacement) {
  return value.split(search).join(replacement);
}
