"use client";

import { useMemo } from "react";
import { useMatches, useTeams } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { CardListSkeleton } from "@/components/ui/states";
import type { Team } from "@/lib/types";

export default function StatsPage() {
  const { data, isLoading } = useMatches();
  const { data: teamsData } = useTeams();

  const stats = useMemo(() => {
    const matches = data?.matches ?? [];
    const finished = matches.filter(
      (m) => m.status === "FINISHED" && m.homeScore !== null
    );
    const goals = finished.reduce(
      (acc, m) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0),
      0
    );
    const live = matches.filter((m) => m.status === "LIVE").length;

    // Goals scored per team.
    const scored = new Map<string, number>();
    for (const m of finished) {
      scored.set(m.home.id, (scored.get(m.home.id) ?? 0) + (m.homeScore ?? 0));
      scored.set(m.away.id, (scored.get(m.away.id) ?? 0) + (m.awayScore ?? 0));
    }
    const teamById = new Map((teamsData?.teams ?? []).map((t) => [t.id, t]));
    const topScorers = [...scored.entries()]
      .map(([id, g]) => ({ team: teamById.get(id), goals: g }))
      .filter((x) => x.team)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 8) as { team: Team; goals: number }[];

    // Biggest win.
    let biggest: { m: (typeof finished)[number]; diff: number } | null = null;
    for (const m of finished) {
      const diff = Math.abs((m.homeScore ?? 0) - (m.awayScore ?? 0));
      if (!biggest || diff > biggest.diff) biggest = { m, diff };
    }

    return {
      played: finished.length,
      total: matches.length,
      live,
      goals,
      avg: finished.length ? (goals / finished.length).toFixed(2) : "0",
      topScorers,
      biggest,
    };
  }, [data, teamsData]);

  if (isLoading) return <CardListSkeleton count={6} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Statistiques</h1>
        <p className="text-sm text-muted">Les chiffres clés du tournoi.</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Matchs joués" value={`${stats.played}/${stats.total}`} />
        <Kpi label="En direct" value={stats.live} accent />
        <Kpi label="Buts" value={stats.goals} />
        <Kpi label="Buts / match" value={stats.avg} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          Meilleures attaques
        </h2>
        <div className="overflow-hidden rounded-none border border-border bg-surface">
          {stats.topScorers.map((s, i) => (
            <div
              key={s.team.id}
              className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-0"
            >
              <span className="w-4 text-sm font-bold tabular-nums text-muted">
                {i + 1}
              </span>
              <TeamFlag team={s.team} size="sm" />
              <span className="flex-1 truncate text-sm font-medium">
                {s.team.name}
              </span>
              <span className="text-sm font-extrabold tabular-nums">
                {s.goals}
              </span>
            </div>
          ))}
          {stats.topScorers.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted">
              Pas encore de buts.
            </div>
          )}
        </div>
      </section>

      {stats.biggest && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
            Plus large victoire
          </h2>
          <div className="flex items-center justify-center gap-3 rounded-none border border-border bg-surface p-4">
            <TeamFlag team={stats.biggest.m.home} size="md" />
            <span className="text-2xl font-extrabold tabular-nums">
              {stats.biggest.m.homeScore} - {stats.biggest.m.awayScore}
            </span>
            <TeamFlag team={stats.biggest.m.away} size="md" />
          </div>
        </section>
      )}

      <p className="rounded-none border border-dashed border-border bg-surface/50 p-4 text-center text-xs text-muted">
        Les stats avancées (xG, possession, buteurs individuels) arriveront via
        un fournisseur de données connecté.
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-none border border-border bg-surface px-2 py-3 text-center">
      <div
        className={
          "text-xl font-extrabold tabular-nums " + (accent ? "text-live" : "")
        }
      >
        {value}
      </div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
