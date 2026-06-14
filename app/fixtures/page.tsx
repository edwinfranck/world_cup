"use client";

import { useMemo, useState } from "react";
import { useMatches } from "@/lib/api";
import { MatchCard } from "@/components/match-card";
import { CardListSkeleton, EmptyState } from "@/components/ui/states";
import { cn, formatDateLabel } from "@/lib/utils";
import { STAGE_LABELS, type Stage } from "@/lib/types";

type Filter = "ALL" | Stage;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "GROUP", label: "Groupes" },
  { value: "ROUND_32", label: "16es" },
  { value: "ROUND_16", label: "8es" },
  { value: "QUARTER", label: "Quarts" },
  { value: "SEMI", label: "Demies" },
  { value: "FINAL", label: "Finale" },
];

export default function FixturesPage() {
  const { data, isLoading } = useMatches();
  const [filter, setFilter] = useState<Filter>("ALL");

  const byDay = useMemo(() => {
    const matches = (data?.matches ?? []).filter(
      (m) => filter === "ALL" || m.stage === filter
    );
    const map = new Map<string, typeof matches>();
    for (const m of matches) {
      const day = m.utcDate.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, filter]);

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Calendrier</h1>
        <p className="text-sm text-muted">
          Tous les matchs de {STAGE_LABELS.GROUP.toLowerCase()} à la finale.
        </p>
      </header>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-none border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : byDay.length ? (
        <div className="space-y-5">
          {byDay.map(([day, matches]) => (
            <section key={day}>
              <h2 className="mb-2 text-sm font-bold capitalize text-foreground">
                {formatDateLabel(day + "T12:00:00Z")}
              </h2>
              <div className="space-y-2">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState message="Aucun match pour ce filtre." />
      )}
    </div>
  );
}
