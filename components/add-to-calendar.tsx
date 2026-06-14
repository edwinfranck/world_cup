import { CalendarPlus } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

/** "Add to Google Calendar" — opens a pre-filled event in a new tab. */
export function AddToCalendar({
  match,
  variant = "icon",
  className,
}: {
  match: Match;
  variant?: "icon" | "full";
  className?: string;
}) {
  if (match.status !== "SCHEDULED") return null;
  const href = googleCalendarUrl(match);
  if (variant === "full") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-none border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary",
          className
        )}
      >
        <CalendarPlus size={16} /> Ajouter à mon agenda
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ajouter à Google Agenda"
      title="Ajouter à Google Agenda"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-none border border-border text-muted transition-colors hover:border-primary hover:text-primary",
        className
      )}
    >
      <CalendarPlus size={14} />
    </a>
  );
}
