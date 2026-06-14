"use client";

import { Trophy } from "lucide-react";
import { useMatches } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import {
  computeBadges,
  levelFor,
  scorePredictions,
  xpFor,
} from "@/lib/gamification";
import { CardListSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const hydrated = useHydrated();
  const { data } = useMatches();
  const predictions = useAppStore((s) => s.predictions);
  const favoriteTeams = useAppStore((s) => s.favoriteTeams);
  const favoriteMatches = useAppStore((s) => s.favoriteMatches);
  const reset = useAppStore((s) => s.reset);

  if (!hydrated) return <CardListSkeleton count={4} />;

  const score = scorePredictions(predictions, data?.matches ?? []);
  const xp = xpFor(score, favoriteTeams.length);
  const { level, into, needed } = levelFor(xp);
  const badges = computeBadges({
    score,
    favoriteTeams: favoriteTeams.length,
    favoriteMatches: favoriteMatches.length,
  });
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="rounded-none border border-border bg-gradient-to-br from-primary/20 via-surface to-accent/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-none bg-primary text-2xl font-extrabold text-primary-foreground">
            {level}
          </span>
          <div>
            <div className="text-lg font-extrabold">Niveau {level}</div>
            <div className="text-sm text-muted">{xp} XP · {earned}/{badges.length} badges</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Progression</span>
            <span>
              {into}/{needed} XP
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-none bg-surface-2">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (into / needed) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Points" value={score.points} />
        <Kpi label="Pronostics" value={score.total} />
        <Kpi label="Favoris" value={favoriteTeams.length} />
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
          <Trophy size={15} /> Badges
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-none border p-3 text-center",
                b.earned
                  ? "border-primary/40 bg-surface"
                  : "border-border bg-surface/40 opacity-50"
              )}
            >
              <span className="text-2xl">{b.emoji}</span>
              <span className="text-[11px] font-semibold leading-tight">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => {
          if (confirm("Réinitialiser favoris et pronostics ?")) reset();
        }}
        className="w-full rounded-none border border-border bg-surface py-2.5 text-sm font-semibold text-live"
      >
        Réinitialiser mes données
      </button>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-none border border-border bg-surface px-2 py-3 text-center">
      <div className="text-2xl font-extrabold tabular-nums text-primary">
        {value}
      </div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
