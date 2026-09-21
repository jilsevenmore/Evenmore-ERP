import { create } from "zustand";

export const LANGUAGE_KEY = "app_language";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
];

export const DEFAULT_LANGUAGE = "en";

export function isSupportedLanguage(code) {
  return code === "en" || code === "hi" || code === "gu";
}

function loadInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (isSupportedLanguage(saved)) return saved;
  } catch {}
  return DEFAULT_LANGUAGE;
}

function applyLanguageAttributes(lang) {
  try {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", "ltr");
  } catch {}
}

export const useLanguageStore = create((set) => ({
  currentLanguage: (() => {
    const initial = loadInitialLanguage();
    applyLanguageAttributes(initial);
    return initial;
  })(),

  setLanguage: (lang) => {
    const next = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {}
    applyLanguageAttributes(next);
    set({ currentLanguage: next });
  },
}));
