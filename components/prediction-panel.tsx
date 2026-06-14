"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useAppStore, useHydrated, type Outcome } from "@/lib/store";
import { predictionPoints } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

function outcomeOf(h: number, a: number): Outcome {
  return h > a ? "HOME" : h < a ? "AWAY" : "DRAW";
}

export function PredictionPanel({ match }: { match: Match }) {
  const hydrated = useHydrated();
  const existing = useAppStore((s) => s.predictions[match.id]);
  const save = useAppStore((s) => s.savePrediction);

  const [home, setHome] = useState(existing?.homeScore ?? 1);
  const [away, setAway] = useState(existing?.awayScore ?? 1);
  const [saved, setSaved] = useState(false);

  const locked = match.status !== "SCHEDULED";
  const pts = existing ? predictionPoints(existing, match) : null;

  if (!hydrated) {
    return <div className="h-40 rounded-none border border-border bg-surface" />;
  }

  function submit() {
    save({
      matchId: match.id,
      outcome: outcomeOf(home, away),
      homeScore: home,
      awayScore: away,
      createdAt: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-none border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
        Mon pronostic
      </h2>

      {locked ? (
        existing ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Vous aviez prédit{" "}
              <span className="font-bold">
                {existing.homeScore} - {existing.awayScore}
              </span>
            </span>
            {pts !== null && (
              <span
                className={cn(
                  "rounded-none px-2 py-1 text-xs font-bold",
                  pts > 0 ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted"
                )}
              >
                +{pts} pts
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Les pronostics sont fermés pour ce match.
          </p>
        )
      ) : (
        <>
          <div className="flex items-center justify-center gap-4">
            <Stepper label={match.home.code} value={home} onChange={setHome} />
            <span className="text-2xl font-bold text-muted">:</span>
            <Stepper label={match.away.code} value={away} onChange={setAway} />
          </div>
          <button
            onClick={submit}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-none bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {saved ? <Check size={16} /> : null}
            {saved ? "Enregistré !" : existing ? "Modifier" : "Valider"}
          </button>
        </>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-none border border-border bg-surface-2 hover:text-primary"
          aria-label="Moins"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-2xl font-extrabold tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(15, value + 1))}
          className="grid h-8 w-8 place-items-center rounded-none border border-border bg-surface-2 hover:text-primary"
          aria-label="Plus"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
