import type { Match } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";

function fmt(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Build a Google Calendar "add event" link for a match — no API, no auth.
 * The user just clicks and Google opens a pre-filled event they can save.
 */
export function googleCalendarUrl(match: Match): string {
  const start = new Date(match.utcDate);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const title = `${match.home.name} - ${match.away.name} | Mondial 2026`;
  const details = [
    match.groupId ? `Groupe ${match.groupId}` : STAGE_LABELS[match.stage],
    "Coupe du Monde FIFA 2026",
  ].join(" · ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    location: match.venue ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
