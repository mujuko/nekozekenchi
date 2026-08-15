import { messages, type Messages } from "./messages";

export const LOCALE_STORAGE_KEY = "nekozekenchi:locale";

export type Locale = "ja" | "en";

export function isLocale(value: unknown): value is Locale {
  return value === "ja" || value === "en";
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] as Messages;
}
