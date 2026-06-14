"use client";

import { useAppStore, useHydrated, type Locale } from "@/lib/store";
import { LOCALES } from "@/lib/i18n";

export function LanguageToggle() {
  const hydrated = useHydrated();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const current = hydrated ? locale : "fr";

  function cycle() {
    const i = LOCALES.findIndex((l) => l.value === current);
    const next = LOCALES[(i + 1) % LOCALES.length].value as Locale;
    setLocale(next);
  }

  return (
    <button
      type="button"
      aria-label="Changer de langue"
      onClick={cycle}
      className="grid h-9 w-9 place-items-center border border-border bg-surface-2 text-xs font-bold text-foreground transition-colors hover:text-primary"
    >
      {LOCALES.find((l) => l.value === current)?.label}
    </button>
  );
}
