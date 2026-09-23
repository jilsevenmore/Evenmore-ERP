import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, useLanguageStore } from "../../stores/languageStore";
import { useTranslation } from "../../i18n";

export default function LanguageSelector({ compact = false }) {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const active = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-soft text-text flex items-center gap-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer"
        aria-label={t("settings.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t("settings.language")}
      >
        <Globe size={15} className="text-primary shrink-0" />
        <span className={compact ? "hidden lg:inline" : "hidden md:inline"}>
          {active.nativeLabel}
        </span>
        <ChevronDown size={13} className="text-muted" />
      </button>

      {open && (
        <div
          className="top-dropdown-menu w-52 p-2 animate-in fade-in zoom-in-95 duration-150 shadow-xl"
          role="listbox"
          aria-label={t("settings.language")}
        >
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
            {t("settings.language")}
          </div>
          <div className="space-y-0.5">
            {SUPPORTED_LANGUAGES.map((l) => {
              const selected = l.code === currentLanguage;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLanguage(l.code);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-text hover:bg-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={selected ? { background: "var(--primary-subtle)", fontWeight: 700 } : undefined}
                >
                  <span className="flex flex-col items-start leading-tight">
                    <span className="font-semibold">{l.nativeLabel}</span>
                    <span className="text-[10px] text-muted">{l.label}</span>
                  </span>
                  {selected && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
