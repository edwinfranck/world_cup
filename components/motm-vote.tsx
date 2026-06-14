"use client";

import { Star } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

/**
 * Local "Man of the Match" vote — pick from the match lineups. Stored on-device
 * (no backend), so it reflects the user's own pick rather than a global tally.
 */
export function MotmVote({ match }: { match: Match }) {
  const hydrated = useHydrated();
  const vote = useAppStore((s) => s.motmVotes[match.id]);
  const setVote = useAppStore((s) => s.voteMotm);

  if (match.status === "SCHEDULED" || !match.lineups) return null;

  const players = [
    ...match.lineups.home.starters.map((p) => ({ ...p, team: match.home })),
    ...match.lineups.away.starters.map((p) => ({ ...p, team: match.away })),
  ];
  if (!players.length) return null;

  return (
    <div className="rounded-none border border-border bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
        <Star size={15} /> Homme du match
      </h2>
      {hydrated && vote && (
        <p className="mb-2 text-xs text-muted">
          Votre choix : <span className="font-bold text-gold">{vote}</span>
        </p>
      )}
      <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto">
        {players.map((p, i) => {
          const selected = hydrated && vote === p.name;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setVote(match.id, p.name)}
              className={cn(
                "flex items-center gap-1.5 border px-2 py-1.5 text-left text-xs transition-colors",
                selected
                  ? "border-gold bg-gold/15 font-bold"
                  : "border-border hover:border-gold"
              )}
            >
              <span className="text-sm leading-none">{p.team.flag}</span>
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {selected && <Star size={12} className="text-gold" fill="currentColor" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
