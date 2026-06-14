"use client";

import { useMemo } from "react";
import { Crown } from "lucide-react";
import { useMatches } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { scorePredictions } from "@/lib/gamification";
import { CardListSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

// Deterministic simulated rivals (no backend). Base points are fixed so the
// board is stable; the user is inserted at their real rank.
const RIVALS: { name: string; pts: number; flag: string }[] = [
  { name: "Léa", pts: 87, flag: "🇫🇷" },
  { name: "Carlos", pts: 81, flag: "🇪🇸" },
  { name: "Kenji", pts: 76, flag: "🇯🇵" },
  { name: "Amara", pts: 73, flag: "🇸🇳" },
  { name: "Mads", pts: 69, flag: "🇩🇰" },
  { name: "Sofia", pts: 64, flag: "🇧🇷" },
  { name: "Omar", pts: 58, flag: "🇲🇦" },
  { name: "Nora", pts: 52, flag: "🇳🇴" },
  { name: "Diego", pts: 47, flag: "🇦🇷" },
  { name: "Yuki", pts: 41, flag: "🇰🇷" },
  { name: "Pavel", pts: 35, flag: "🇨🇿" },
  { name: "Tariq", pts: 28, flag: "🇪🇬" },
  { name: "Emma", pts: 22, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Hugo", pts: 16, flag: "🇵🇹" },
  { name: "Ana", pts: 9, flag: "🇨🇴" },
];

export default function LeaderboardPage() {
  const hydrated = useHydrated();
  const { data, isLoading } = useMatches();
  const predictions = useAppStore((s) => s.predictions);

  const board = useMemo(() => {
    const me = scorePredictions(predictions, data?.matches ?? []).points;
    const rows = [
      ...RIVALS,
      { name: "Vous", pts: me, flag: "⭐", me: true },
    ].sort((a, b) => b.pts - a.pts);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [predictions, data]);

  if (isLoading || !hydrated) return <CardListSkeleton count={8} />;

  const myRank = board.find((r) => "me" in r && r.me)?.rank ?? 0;

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Classement pronostics</h1>
        <p className="text-sm text-muted">
          Vous êtes {myRank}e sur {board.length}. Marquez des points en
          pronostiquant les matchs.
        </p>
      </header>

      <div className="border border-border bg-surface">
        {board.map((r) => {
          const me = "me" in r && r.me;
          return (
            <div
              key={r.name}
              className={cn(
                "flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-0",
                me && "bg-primary/10"
              )}
            >
              <span
                className={cn(
                  "w-6 text-center text-sm font-bold tabular-nums",
                  r.rank === 1 ? "text-gold" : "text-muted"
                )}
              >
                {r.rank === 1 ? <Crown size={16} className="mx-auto text-gold" /> : r.rank}
              </span>
              <span className="text-base leading-none">{r.flag}</span>
              <span className={cn("flex-1 truncate text-sm", me ? "font-extrabold" : "font-medium")}>
                {r.name}
              </span>
              <span className="text-sm font-bold tabular-nums">{r.pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
