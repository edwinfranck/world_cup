import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TeamFlag } from "@/components/team-flag";
import { STAGE_LABELS, type Match } from "@/lib/types";

/**
 * Prominent, tappable live-match card for the dashboard: big scoreline, pulsing
 * minute, both teams, and a clear "follow live" call to action → match detail.
 */
export function LiveCard({ match }: { match: Match }) {
  const clock = match.clock || (match.minute ? `${match.minute}'` : "DIRECT");
  return (
    <Link
      href={`/match/${match.id}`}
      className="block border border-live/60 bg-surface transition-colors hover:border-live"
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-live/10 px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-live">
          <span className="h-1.5 w-1.5 rounded-none bg-live animate-pulse-live" />
          En direct · {clock}
        </span>
        <span className="truncate text-[11px] font-semibold text-muted">
          {match.groupId ? `Groupe ${match.groupId}` : STAGE_LABELS[match.stage]}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
        <div className="flex items-center gap-2">
          <TeamFlag team={match.home} size="md" />
          <span className="truncate text-sm font-bold">{match.home.name}</span>
        </div>
        <div className="px-2 text-center text-2xl font-extrabold tabular-nums">
          {match.homeScore ?? 0}
          <span className="mx-1 text-muted">-</span>
          {match.awayScore ?? 0}
        </div>
        <div className="flex items-center justify-end gap-2 text-right">
          <span className="truncate text-sm font-bold">{match.away.name}</span>
          <TeamFlag team={match.away} size="md" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 border-t border-border/60 py-1.5 text-[11px] font-semibold text-live">
        Suivre le direct <ChevronRight size={13} />
      </div>
    </Link>
  );
}
