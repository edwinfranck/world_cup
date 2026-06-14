"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom dropdown (no native <select>): styled trigger + floating panel with an
 * optional type-ahead filter. Closes on outside click / Escape. Selecting the
 * placeholder row clears the value ("" ), matching a native empty <option>.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Sélectionner",
  ariaLabel,
  className,
  triggerClassName,
  size = "md",
  searchable = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "md";
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
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

  const selected = options.find((o) => o.value === value);
  const filtered =
    searchable && query
      ? options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        )
      : options;

  const pad = size === "sm" ? "px-2 py-1.5 text-xs" : "px-2 py-2 text-sm";

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 border border-border bg-surface text-left text-foreground outline-none transition-colors hover:border-primary focus:border-primary",
          pad,
          triggerClassName
        )}
      >
        <span className={cn("truncate", !selected && "text-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={size === "sm" ? 14 : 16}
          className={cn(
            "shrink-0 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden border border-border bg-surface shadow-lg"
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
              <Search size={13} className="shrink-0 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            <Row
              label={placeholder}
              active={!value}
              muted
              onClick={() => choose("")}
            />
            {filtered.length ? (
              filtered.map((o) => (
                <Row
                  key={o.value}
                  label={o.label}
                  active={o.value === value}
                  onClick={() => choose(o.value)}
                />
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-muted">Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  active,
  muted,
  onClick,
}: {
  label: string;
  active: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
        active ? "font-bold text-primary" : muted ? "text-muted" : "text-foreground"
      )}
    >
      <span className="truncate">{label}</span>
      {active && <Check size={15} className="shrink-0" />}
    </button>
  );
}
