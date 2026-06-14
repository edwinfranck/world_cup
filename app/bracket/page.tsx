"use client";

import { useGroups } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { CardListSkeleton } from "@/components/ui/states";
import { STAGE_LABELS } from "@/lib/types";

export default function BracketPage() {
  const { data, isLoading } = useGroups();
  const groups = data?.groups ?? [];

  // Projected qualifiers: top 2 of each group (knockout draw not yet set).
  const qualified = groups.flatMap((g) =>
    g.standings.slice(0, 2).map((s) => ({ ...s, groupId: g.id }))
  );

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Tableau final</h1>
        <p className="text-sm text-muted">
          Qualifiés projetés d&apos;après les classements actuels. Le tableau des
          {" "}
          {STAGE_LABELS.ROUND_32.toLowerCase()} se remplira à la fin des poules.
        </p>
      </header>

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {qualified.map((q) => (
            <div
              key={`${q.groupId}-${q.position}`}
              className="flex items-center justify-between rounded-none border border-border bg-surface px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <TeamFlag team={q.team} size="sm" />
                <span className="text-sm font-semibold">{q.team.name}</span>
              </div>
              <span className="rounded-none bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
                {q.position === 1 ? "1er" : "2e"} · Gr. {q.groupId}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-none border border-dashed border-border bg-surface/50 p-4 text-sm text-muted">
        🏆 Le simulateur de phases finales (modifier les résultats et recalculer le
        tableau) arrive dans une prochaine itération.
      </div>
    </div>
  );
}
