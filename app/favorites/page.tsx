"use client";

import Link from "next/link";
import { useMatches, useTeams } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { TeamFlag } from "@/components/team-flag";
import { FavoriteTeamButton } from "@/components/favorite-button";
import { MatchCard } from "@/components/match-card";
import { CardListSkeleton, EmptyState } from "@/components/ui/states";

export default function FavoritesPage() {
  const hydrated = useHydrated();
  const { data: teamsData, isLoading: tl } = useTeams();
  const { data: matchesData, isLoading: ml } = useMatches();
  const favTeams = useAppStore((s) => s.favoriteTeams);
  const favMatches = useAppStore((s) => s.favoriteMatches);

  const teams = (teamsData?.teams ?? []).filter((t) => favTeams.includes(t.id));
  const allMatches = matchesData?.matches ?? [];
  // Matches involving favourite teams + explicitly followed matches.
  const matchIds = new Set(favMatches);
  const matches = allMatches.filter(
    (m) =>
      matchIds.has(m.id) ||
      favTeams.includes(m.home.id) ||
      favTeams.includes(m.away.id)
  );

  if (!hydrated || tl || ml) return <CardListSkeleton count={5} />;

  const empty = teams.length === 0 && matches.length === 0;

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Mes favoris</h1>
        <p className="text-sm text-muted">Vos équipes et matchs suivis.</p>
      </header>

      {empty ? (
        <EmptyState message="Aucun favori. Touchez le ❤ sur une équipe ou un match." />
      ) : (
        <>
          {teams.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                Équipes
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-none border border-border bg-surface px-3 py-2.5"
                  >
                    <Link
                      href={`/teams/${t.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <TeamFlag team={t} size="md" />
                      <span className="truncate text-sm font-semibold">
                        {t.name}
                      </span>
                    </Link>
                    <FavoriteTeamButton code={t.id} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {matches.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                Matchs
              </h2>
              <div className="space-y-2">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
