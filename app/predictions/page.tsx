"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { useMatches } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { predictionPoints, scorePredictions } from "@/lib/gamification";
import { TeamFlag } from "@/components/team-flag";
import { EmptyState, CardListSkeleton } from "@/components/ui/states";

export default function PredictionsPage() {
  const hydrated = useHydrated();
  const { data, isLoading } = useMatches();
  const predictions = useAppStore((s) => s.predictions);

  const matches = data?.matches ?? [];
  const byId = new Map(matches.map((m) => [m.id, m]));
  const score = scorePredictions(predictions, matches);
  const list = Object.values(predictions).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Pronostics</h1>
        <p className="text-sm text-muted">
          Score exact = 5 pts · bon résultat = 2 pts.
        </p>
      </header>

      {hydrated && (
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Points" value={score.points} accent />
          <Kpi label="Scores exacts" value={score.exact} />
          <Kpi label="Pronostics" value={score.total} />
        </div>
      )}

      {!hydrated || isLoading ? (
        <CardListSkeleton count={4} />
      ) : list.length === 0 ? (
        <EmptyState message="Aucun pronostic. Ouvrez un match pour pronostiquer !" />
      ) : (
        <div className="space-y-2">
          {list.map((p) => {
            const m = byId.get(p.matchId);
            if (!m) return null;
            const pts = predictionPoints(p, m);
            return (
              <Link
                key={p.matchId}
                href={`/match/${p.matchId}`}
                className="flex items-center gap-2 rounded-none border border-border bg-surface p-3"
              >
                <TeamFlag team={m.home} size="sm" />
                <span className="flex-1 truncate text-sm font-medium">
                  {m.home.code} {p.homeScore}-{p.awayScore} {m.away.code}
                </span>
                <TeamFlag team={m.away} size="sm" />
                {pts === null ? (
                  <span className="rounded-none bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                    À venir
                  </span>
                ) : (
                  <span
                    className={
                      "rounded-none px-2 py-0.5 text-[11px] font-bold " +
                      (pts > 0
                        ? "bg-primary/15 text-primary"
                        : "bg-live/15 text-live")
                    }
                  >
                    +{pts}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/fixtures"
        className="flex items-center justify-center gap-2 rounded-none border border-border bg-surface py-3 text-sm font-semibold text-primary"
      >
        <Target size={16} /> Pronostiquer d&apos;autres matchs
      </Link>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-none border border-border bg-surface px-2 py-3 text-center">
      <div
        className={
          "text-2xl font-extrabold tabular-nums " +
          (accent ? "text-primary" : "")
        }
      >
        {value}
      </div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
