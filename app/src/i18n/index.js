import { useLanguageStore, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isSupportedLanguage } from "../stores/languageStore";
import en from "./en";
import hi from "./hi";
import gu from "./gu";

const RESOURCES = { en, hi, gu };

export const LANGUAGES = SUPPORTED_LANGUAGES;
export { DEFAULT_LANGUAGE, isSupportedLanguage };

export const LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  gu: "gu-IN",
};

function getNested(obj, path) {
  if (!obj || !path) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function toReadableFallback(key) {
  if (!key) return "";
  const last = String(key).split(".").pop() || key;
  const spaced = last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Core translator: current lang -> English fallback -> readable key. Never undefined/null.
export function translate(key, lang, vars) {
  const l = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  let val = getNested(RESOURCES[l], key);
  if (typeof val !== "string") val = getNested(RESOURCES.en, key);
  if (typeof val !== "string") val = toReadableFallback(key);
  if (vars && typeof vars === "object") {
    for (const [k, v] of Object.entries(vars)) {
      val = val.split(`{{${k}}}`).join(String(v));
    }
  }
  return val;
}

// Reverse-map: known English system strings -> key, so centrally-rendered
// feedback (global toast, confirm fallbacks) localizes without touching
// every call site. Unknown / business-data strings render unchanged.
let reverseCache = null;
function englishReverseMap() {
  if (reverseCache) return reverseCache;
  reverseCache = {};
  function walk(obj, prefix) {
    for (const [k, v] of Object.entries(obj || {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        if (!(v in reverseCache)) reverseCache[v] = key;
      } else if (v && typeof v === 'object') {
        walk(v, key);
      }
    }
  }
  walk(RESOURCES.en, '');
  return reverseCache;
}

export function localizeSystemMessage(msg, lang) {
  if (typeof msg !== 'string') return msg ?? '';
  const map = englishReverseMap();
  const key = map[msg] || map[msg.trim()];
  if (!key) return msg;
  return translate(key, lang);
}

export function useLocalizedMessage() {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  return (msg) => localizeSystemMessage(msg, currentLanguage);
}

// Non-hook helper for use outside React (reads persisted language directly).
export function t(key, vars) {
  let lang = DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem("app_language");
    if (isSupportedLanguage(saved)) lang = saved;
    else {
      const raw = localStorage.getItem("language-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        const s = parsed?.state?.currentLanguage || parsed?.currentLanguage;
        if (isSupportedLanguage(s)) lang = s;
      }
    }
  } catch {}
  return translate(key, lang, vars);
}

// React hook: subscribes to language store so UI re-renders on change.
export function useTranslation() {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const fn = (key, vars) => translate(key, currentLanguage, vars);
  return { t: fn, currentLanguage, setLanguage, lang: currentLanguage };
}

// Alias commonly expected by contributors.
export function useT() {
  const { t: fn } = useTranslation();
  return fn;
}

export function formatDateLocalized(input, lang, options) {
  const l = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const locale = LOCALE_MAP[l] || "en-IN";
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input ?? "");
  try {
    return new Intl.DateTimeFormat(locale, options || { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatNumberLocalized(value, lang, options) {
  const l = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const locale = LOCALE_MAP[l] || "en-IN";
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return String(num);
  }
}

export function useLocalizedFormat() {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  return {
    lang: currentLanguage,
    formatDate: (input, options) => formatDateLocalized(input, currentLanguage, options),
    formatNumber: (value, options) => formatNumberLocalized(value, currentLanguage, options),
  };
}

export default { translate, t, useTranslation, useT, formatDateLocalized, formatNumberLocalized };
