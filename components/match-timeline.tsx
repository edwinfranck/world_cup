import { cn } from "@/lib/utils";
import type { Match, MatchEvent } from "@/lib/types";

const ICON: Record<MatchEvent["type"], string> = {
  GOAL: "⚽",
  OWN_GOAL: "⚽",
  PENALTY: "🥅",
  YELLOW: "🟨",
  RED: "🟥",
  SUB: "🔁",
  VAR: "📺",
};

function label(e: MatchEvent): string {
  if (e.type === "OWN_GOAL") return "But contre son camp";
  if (e.type === "PENALTY") return "But (penalty)";
  if (e.type === "GOAL") return e.assist ? `But (passe : ${e.assist})` : "But";
  if (e.type === "YELLOW") return "Carton jaune";
  if (e.type === "RED") return "Carton rouge";
  if (e.type === "SUB") return "Remplacement";
  return e.detail ?? "VAR";
}

export function MatchTimeline({ match }: { match: Match }) {
  const events = match.events ?? [];
  if (!events.length) return null;

  return (
    <div className="rounded-none border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
        Déroulé du match
      </h2>
      <ol className="space-y-2.5">
        {events.map((e, i) => {
          const home = e.side === "home";
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2",
                home ? "flex-row" : "flex-row-reverse text-right"
              )}
            >
              <span className="grid h-6 w-9 shrink-0 place-items-center rounded-none bg-surface-2 text-xs font-bold tabular-nums text-muted">
                {e.minute}&apos;
              </span>
              <span className="text-base leading-none">{ICON[e.type]}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {e.player ?? "—"}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {label(e)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
