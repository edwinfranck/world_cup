"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useAppStore, useHydrated, type Locale } from "@/lib/store";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Custom language selector dropdown (no native <select>) for the header. */
export function LanguageDropdown() {
  const hydrated = useHydrated();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const current = hydrated ? locale : "fr";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(value: Locale) {
    setLocale(value);
    setOpen(false);
  }

  const currentLabel = LOCALES.find((l) => l.value === current)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Changer de langue"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1 rounded-none border border-border bg-surface-2 px-2 text-xs font-bold text-foreground transition-colors hover:text-primary"
      >
        {currentLabel}
        <ChevronDown
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-none border border-border bg-surface shadow-lg"
        >
          {LOCALES.map((l) => {
            const active = l.value === current;
            return (
              <button
                key={l.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(l.value as Locale)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
                  active ? "font-bold text-primary" : "text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-muted">{l.label}</span>
                  {l.name}
                </span>
                {active && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
