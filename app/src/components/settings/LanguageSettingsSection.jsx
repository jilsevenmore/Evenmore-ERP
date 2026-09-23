import { Globe, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, useLanguageStore } from "../../stores/languageStore";
import { useTranslation } from "../../i18n";

/**
 * LanguageSettingsSection — Settings → Language card.
 * Radio-group bound to the same global language store as the header
 * LanguageSelector, so both controls stay in sync. Selection applies
 * instantly (no reload) and persists via `app_language`.
 * LTR only (en/hi/gu); shows a live preview of common UI strings.
 */
export default function LanguageSettingsSection() {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const { t } = useTranslation();

  const active =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <section
      aria-labelledby="language-settings-heading"
      className="bg-white border border-[#CED4DA] rounded-lg p-5"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
        <Globe className="text-[#1F2E4A]" size={18} />
        <h3 id="language-settings-heading" className="font-bold text-sm text-[#1F2E4A]">
          {t("settings.language")}
        </h3>
      </div>

      <p className="text-xs text-slate-500 mb-1">{t("settings.chooseLanguage")}</p>
      <p className="text-[11px] text-slate-400 mb-4">{t("settings.languageDescription")}</p>

      <div role="radiogroup" aria-label={t("settings.language")} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map((l) => {
          const selected = l.code === currentLanguage;
          return (
            <label
              key={l.code}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition focus-within:ring-2 focus-within:ring-primary ${
                selected
                  ? "border-primary bg-primary/5 font-bold"
                  : "border-[#CED4DA] bg-[#F8F9FA] hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="app-language"
                value={l.code}
                checked={selected}
                onChange={() => setLanguage(l.code)}
                className="w-4 h-4 accent-[#1F2E4A]"
                aria-label={`${l.nativeLabel} (${l.label})`}
              />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-800">{l.nativeLabel}</span>
                <span className="text-[11px] text-slate-500">{l.label}</span>
              </span>
              {selected && <Check size={15} className="ml-auto text-primary shrink-0" />}
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
        <span className="font-semibold text-slate-700">
          {t("settings.currentLanguage")}:{" "}
          <span className="font-bold text-[#1F2E4A]">
            {active.nativeLabel} ({active.label})
          </span>
        </span>
        <span className="sm:ml-auto flex items-center gap-1.5 flex-wrap" aria-label={t("settings.languagePreview")}>
          <span className="text-[11px] text-slate-400 font-semibold mr-1">{t("settings.languagePreview")}:</span>
          {[t("common.dashboard"), t("common.save"), t("common.cancel"), t("common.settings")].map((word) => (
            <span
              key={word}
              className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]"
            >
              {word}
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
