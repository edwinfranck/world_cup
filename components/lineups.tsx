import { TeamFlag } from "@/components/team-flag";
import type { Match, TeamLineup } from "@/lib/types";

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
      <div className="grid grid-cols-2 gap-4">
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
          <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">
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
  players: { name: string; number?: string; position?: string }[];
  muted?: boolean;
}) {
  if (!players.length) return null;
  return (
    <div className="mb-2">
      <p className="mb-1 text-[10px] font-bold uppercase text-muted">{title}</p>
      <ul className="space-y-1">
        {players.map((p, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-5 shrink-0 text-right tabular-nums text-muted">
              {p.number ?? ""}
            </span>
            <span className={muted ? "truncate text-muted" : "truncate font-medium"}>
              {p.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
