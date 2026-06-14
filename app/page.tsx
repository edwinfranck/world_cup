"use client";

import Link from "next/link";
import { ChevronRight, Radio } from "lucide-react";
import { useMatches, useGroups } from "@/lib/api";
import { MatchCard } from "@/components/match-card";
import { StandingsTable } from "@/components/standings-table";
import { SectionHeader } from "@/components/ui/card";
import { CardListSkeleton, EmptyState } from "@/components/ui/states";
import type { Match } from "@/lib/types";

export default function DashboardPage() {
  const { data, isLoading } = useMatches();
  const { data: groupsData, isLoading: groupsLoading } = useGroups();

  const matches = data?.matches ?? [];
  const live = matches.filter(
    (m) => m.status === "LIVE" || m.status === "PAUSED"
  );
  // Real fixtures are date-sorted; finished ones are the most recent results.
  const recent = matches
    .filter((m) => m.status === "FINISHED")
    .slice(-6)
    .reverse();
  const now = Date.now();
  const upcoming = matches
    .filter((m) => m.status === "SCHEDULED" && new Date(m.utcDate).getTime() >= now - 3 * 3600_000)
    .slice(0, 6);

  const featuredGroups = groupsData?.groups?.slice(0, 2) ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <Hero liveCount={live.length} />

      <section>
        <SectionHeader
          title="En direct"
          action={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-live">
              <Radio size={13} /> {live.length}
            </span>
          }
        />
        {isLoading ? (
          <CardListSkeleton count={2} />
        ) : live.length ? (
          <div className="space-y-2">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptyState message="Aucun match en direct pour le moment." />
        )}
      </section>

      <MatchSection
        title="Prochains matchs"
        matches={upcoming}
        loading={isLoading}
        empty="Aucun match à venir."
      />

      <section>
        <SectionHeader
          title="Classements"
          action={
            <Link
              href="/groups"
              className="inline-flex items-center text-xs font-semibold text-primary"
            >
              Tout voir <ChevronRight size={14} />
            </Link>
          }
        />
        {groupsLoading ? (
          <CardListSkeleton count={2} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {featuredGroups.map((g) => (
              <div key={g.id}>
                <p className="mb-1.5 text-xs font-bold text-muted">
                  Groupe {g.id}
                </p>
                <StandingsTable group={g} />
              </div>
            ))}
          </div>
        )}
      </section>

      <MatchSection
        title="Résultats récents"
        matches={recent}
        loading={isLoading}
        empty="Pas encore de résultats."
      />
    </div>
  );
}

function MatchSection({
  title,
  matches,
  loading,
  empty,
}: {
  title: string;
  matches: Match[];
  loading: boolean;
  empty: string;
}) {
  return (
    <section>
      <SectionHeader title={title} />
      {loading ? (
        <CardListSkeleton />
      ) : matches.length ? (
        <div className="space-y-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <EmptyState message={empty} />
      )}
    </section>
  );
}

function Hero({ liveCount }: { liveCount: number }) {
  return (
    <div className="relative overflow-hidden rounded-none border border-border bg-gradient-to-br from-primary/20 via-surface to-accent/10 p-5">
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          FIFA World Cup 2026
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">
          Le Mondial, en direct.
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Scores live, groupes, calendrier et statistiques des 48 nations —
          USA · Canada · Mexique.
        </p>
        {liveCount > 0 && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-none bg-live/15 px-3 py-1 text-xs font-bold text-live">
            <span className="h-2 w-2 rounded-none bg-live animate-pulse-live" />
            {liveCount} match{liveCount > 1 ? "s" : ""} en direct
          </span>
        )}
      </div>
    </div>
  );
}
