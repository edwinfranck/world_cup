import Image from "next/image";
import { User } from "lucide-react";
import { TeamFlag } from "@/components/team-flag";
import type { LineupPlayer, Match, TeamLineup } from "@/lib/types";

export function Lineups({ match }: { match: Match }) {
  const l = match.lineups;
  if (!l) return null;
  const hasAny =
    l.home.starters.length ||
    l.away.starters.length ||
    l.home.bench.length ||
    l.away.bench.length;
  if (!hasAny) return null;

  return (
    <div className="rounded-none border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
        Compositions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <TeamColumn team={match.home} lineup={l.home} />
        <TeamColumn team={match.away} lineup={l.away} />
      </div>
    </div>
  );
}

function TeamColumn({
  team,
  lineup,
}: {
  team: Match["home"];
  lineup: TeamLineup;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <TeamFlag team={team} size="sm" />
        <span className="truncate text-sm font-bold">{team.name}</span>
        {lineup.formation && (
          <span className="ml-auto rounded-none bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">
            {lineup.formation}
          </span>
        )}
      </div>

      <PlayerList title="Titulaires" players={lineup.starters} />
      {lineup.bench.length > 0 && (
        <PlayerList title="Remplaçants" players={lineup.bench} muted />
      )}
    </div>
  );
}

function PlayerList({
  title,
  players,
  muted,
}: {
  title: string;
  players: LineupPlayer[];
  muted?: boolean;
}) {
  if (!players.length) return null;
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase text-muted">
        {title}
      </p>
      <ul className="space-y-1.5">
        {players.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-none border border-border bg-surface-2">
              {p.photo ? (
                <Image
                  src={p.photo}
                  alt={p.name}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover object-top"
                  unoptimized
                />
              ) : (
                <User size={16} className="text-muted" />
              )}
            </span>
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">
              {p.number ?? ""}
            </span>
            <span
              className={
                "min-w-0 flex-1 truncate text-xs " +
                (muted ? "text-muted" : "font-medium")
              }
            >
              {p.name}
              {p.captain && (
                <span className="ml-1 rounded-none bg-gold/20 px-1 text-[9px] font-bold text-gold">
                  C
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
