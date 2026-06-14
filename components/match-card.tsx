import Link from "next/link";
import { TeamFlag } from "@/components/team-flag";
import { AddToCalendar } from "@/components/add-to-calendar";
import { cn, formatKickoff } from "@/lib/utils";
import type { Match } from "@/lib/types";

function StatusPill({ match }: { match: Match }) {
  if (match.status === "LIVE" || match.status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-none bg-live/15 px-1.5 py-0.5 text-[11px] font-bold text-live">
        <span className="h-1.5 w-1.5 rounded-none bg-live animate-pulse-live" />
        {match.clock || (match.minute ? `${match.minute}'` : "LIVE")}
      </span>
    );
  }
  if (match.status === "FINISHED") {
    return (
      <span className="rounded-none bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
        Terminé
      </span>
    );
  }
  return (
    <span className="rounded-none bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
      {formatKickoff(match.utcDate)}
    </span>
  );
}

function TeamRow({
  team,
  score,
  isWinner,
  played,
}: {
  team: Match["home"];
  score: number | null;
  isWinner: boolean;
  played: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <TeamFlag team={team} size="sm" />
        <span
          className={cn(
            "truncate text-sm",
            isWinner ? "font-bold text-foreground" : "font-medium"
          )}
        >
          {team.name}
        </span>
      </div>
      {played && (
        <span
          className={cn(
            "tabular-nums text-sm",
            isWinner ? "font-extrabold text-foreground" : "font-semibold text-muted"
          )}
        >
          {score ?? 0}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const played = match.status === "FINISHED" || match.status === "LIVE" || match.status === "PAUSED";
  const homeWin = played && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = played && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    // Stretched-link card: the navigation <Link> covers the whole card while
    // the "add to calendar" button stays a clickable sibling above it, so we
    // keep one tap target without nesting anchors (invalid HTML).
    <div className="relative rounded-none border border-border bg-surface p-3 transition-colors hover:border-primary/50">
      <Link
        href={`/match/${match.id}`}
        aria-label={`${match.home.name} – ${match.away.name}`}
        className="absolute inset-0 z-[1]"
      />
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted">
        <span className="truncate">
          {match.groupId ? `Groupe ${match.groupId}` : match.venue}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill match={match} />
          <AddToCalendar match={match} className="relative z-[2] h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <TeamRow team={match.home} score={match.homeScore} isWinner={homeWin} played={played} />
        <TeamRow team={match.away} score={match.awayScore} isWinner={awayWin} played={played} />
      </div>
    </div>
  );
}
