import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a kickoff ISO date for display. */
export function formatKickoff(iso: string, locale = "fr-FR") {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateLabel(iso: string, locale = "fr-FR") {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** Compact date + time, e.g. "14/06 · 23:00". */
export function formatShortDateTime(iso: string, locale = "fr-FR") {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
  return `${date} · ${formatKickoff(iso, locale)}`;
}

export function isSameDay(a: string | Date, b: string | Date) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
