"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTeams } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { FavoriteTeamButton } from "@/components/favorite-button";
import { CardListSkeleton } from "@/components/ui/states";

export default function TeamsPage() {
  const { data, isLoading } = useTeams();
  const [q, setQ] = useState("");

  const byGroup = useMemo(() => {
    const teams = (data?.teams ?? []).filter((t) =>
      t.name.toLowerCase().includes(q.toLowerCase())
    );
    const map = new Map<string, typeof teams>();
    for (const t of teams) {
      const g = t.groupId ?? "—";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, q]);

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Équipes</h1>
        <p className="text-sm text-muted">Les 48 nations qualifiées.</p>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une équipe…"
        className="w-full rounded-none border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : (
        <div className="space-y-5">
          {byGroup.map(([group, teams]) => (
            <section key={group}>
              <h2 className="mb-2 text-sm font-bold text-muted">
                Groupe {group}
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
          ))}
        </div>
      )}
    </div>
  );
}
