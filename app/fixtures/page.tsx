"use client";

import { useMemo, useState } from "react";
import { useMatches } from "@/lib/api";
import { MatchCard } from "@/components/match-card";
import { AddToCalendar } from "@/components/add-to-calendar";
import { CardListSkeleton, EmptyState } from "@/components/ui/states";
import { cn, formatDateLabel } from "@/lib/utils";
import { type Stage } from "@/lib/types";

type Phase = "ALL" | Stage;
type When = "ALL" | "UPCOMING" | "PAST";

const PHASES: { value: Phase; label: string }[] = [
  { value: "ALL", label: "Toutes phases" },
  { value: "GROUP", label: "Groupes" },
  { value: "ROUND_32", label: "16es" },
  { value: "ROUND_16", label: "8es" },
  { value: "QUARTER", label: "Quarts" },
  { value: "SEMI", label: "Demies" },
  { value: "FINAL", label: "Finale" },
];

const WHEN: { value: When; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "UPCOMING", label: "À venir" },
  { value: "PAST", label: "Passés" },
];

const GROUPS = "ABCDEFGHIJKL".split("");

export default function FixturesPage() {
  const { data, isLoading } = useMatches();
  const [phase, setPhase] = useState<Phase>("ALL");
  const [when, setWhen] = useState<When>("ALL");
  const [group, setGroup] = useState<string>("");

  const byDay = useMemo(() => {
    let matches = data?.matches ?? [];

    if (when === "PAST") matches = matches.filter((m) => m.status === "FINISHED");
    if (when === "UPCOMING")
      matches = matches.filter((m) => m.status !== "FINISHED");

    if (group) {
      matches = matches.filter((m) => m.groupId === group);
    } else if (phase !== "ALL") {
      matches = matches.filter((m) => m.stage === phase);
    }

    const map = new Map<string, typeof matches>();
    for (const m of matches) {
      const day = m.utcDate.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return when === "PAST" ? entries.reverse() : entries;
  }, [data, phase, when, group]);

  const total = byDay.reduce((n, [, ms]) => n + ms.length, 0);

  return (
    <div className="space-y-3 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Calendrier</h1>
        <p className="text-sm text-muted">{total} matchs · de la phase de groupes à la finale.</p>
      </header>

      {/* When tabs */}
      <div className="flex gap-0 border border-border">
        {WHEN.map((w) => (
          <button
            key={w.value}
            onClick={() => setWhen(w.value)}
            className={cn(
              "flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
              when === w.value
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted hover:text-foreground"
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Phase chips */}
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        {PHASES.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setPhase(f.value);
              if (f.value !== "GROUP" && f.value !== "ALL") setGroup("");
            }}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-xs font-semibold transition-colors",
              phase === f.value && !group
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Group selector (A–L) */}
      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        <button
          onClick={() => setGroup("")}
          className={cn(
            "shrink-0 border px-2.5 py-1 text-xs font-bold transition-colors",
            !group
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-muted hover:text-foreground"
          )}
        >
          Tous
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => {
              setGroup(g);
              setPhase("GROUP");
            }}
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center border text-xs font-bold transition-colors",
              group === g
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : byDay.length ? (
        <div className="space-y-5 pt-1">
          {byDay.map(([day, matches]) => (
            <section key={day}>
              <h2 className="mb-2 text-sm font-bold capitalize text-foreground">
                {formatDateLabel(day + "T12:00:00Z")}
              </h2>
              <div className="space-y-2">
                {matches.map((m) => (
                  <div key={m.id} className="flex items-stretch gap-2">
                    <div className="min-w-0 flex-1">
                      <MatchCard match={m} />
                    </div>
                    <div className="flex items-center">
                      <AddToCalendar match={m} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState message="Aucun match pour ces filtres." />
      )}
    </div>
  );
}
