"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMatches, useTeams, useGroups } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { FavoriteTeamButton } from "@/components/favorite-button";
import { MatchCard } from "@/components/match-card";
import { AddToCalendar } from "@/components/add-to-calendar";
import { SquadList } from "@/components/squad-list";
import { Skeleton, EmptyState } from "@/components/ui/states";
import type { Match } from "@/lib/types";

export default function TeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { data: teamsData, isLoading: tl } = useTeams();
  const { data: matchesData, isLoading: ml } = useMatches();
  const { data: groupsData } = useGroups();

  const team = teamsData?.teams.find((t) => t.id === code);
  const matches = (matchesData?.matches ?? []).filter(
    (m) => m.home.id === code || m.away.id === code
  );
  const group = groupsData?.groups.find((g) => g.id === team?.groupId);
  const standing = group?.standings.find((s) => s.team.id === code);

  if (tl || ml) return <Skeleton className="h-64 w-full" />;
  if (!team)
    return <EmptyState message="Équipe introuvable." />;

  // Form from finished matches (most recent 5).
  const finished = matches.filter((m) => m.status === "FINISHED");
  const form = finished.slice(-5).map((m) => resultFor(m, code));
  const results = [...finished].reverse();
  const upcoming = matches.filter((m) => m.status !== "FINISHED");

  return (
    <div className="space-y-4 animate-fade-up">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Équipes
      </Link>

      <div className="rounded-none border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <TeamFlag team={team} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">{team.name}</h1>
            <p className="text-sm text-muted">
              Groupe {team.groupId} · {team.code}
            </p>
          </div>
          <FavoriteTeamButton code={team.id} size={22} />
        </div>

        {standing && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <Stat label="Pos." value={`${standing.position}e`} />
            <Stat label="Pts" value={standing.points} />
            <Stat label="V-N-D" value={`${standing.won}-${standing.draw}-${standing.lost}`} />
            <Stat label="Diff." value={signed(standing.goalDifference)} />
          </div>
        )}

        {form.length > 0 && (
          <div className="mt-4 flex items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-muted">Forme</span>
            {form.map((r, i) => (
              <span
                key={i}
                className={
                  "grid h-6 w-6 place-items-center rounded-none text-xs font-bold text-white " +
                  (r === "W" ? "bg-primary" : r === "D" ? "bg-muted" : "bg-live")
                }
              >
                {r === "W" ? "V" : r === "D" ? "N" : "D"}
              </span>
            ))}
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          Effectif
        </h2>
        <SquadList code={team.id} />
      </section>

      {results.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
            Résultats
          </h2>
          <div className="space-y-2">
            {results.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
            À venir
          </h2>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <div key={m.id} className="flex items-stretch gap-2">
                <div className="min-w-0 flex-1">
                  <MatchCard match={m} />
                </div>
                <div className="flex items-center">
                  <AddToCalendar match={m} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function resultFor(m: Match, code: string): "W" | "D" | "L" {
  const isHome = m.home.id === code;
  const me = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0;
  const opp = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0;
  return me > opp ? "W" : me < opp ? "L" : "D";
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-none bg-surface-2 px-2 py-2">
      <div className="text-base font-extrabold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
