"use client";

import { useGroups } from "@/lib/api";
import { StandingsTable } from "@/components/standings-table";
import { CardListSkeleton, EmptyState } from "@/components/ui/states";

export default function GroupsPage() {
  const { data, isLoading } = useGroups();
  const groups = data?.groups ?? [];

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Groupes</h1>
        <p className="text-sm text-muted">
          Classements en temps réel — les 2 premiers (vert) et les meilleurs 3es
          (or) se qualifient.
        </p>
      </header>

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : groups.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id}>
              <h2 className="mb-1.5 text-sm font-bold text-muted">
                Groupe {g.id}
              </h2>
              <StandingsTable group={g} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Classements indisponibles." />
      )}
    </div>
  );
}
