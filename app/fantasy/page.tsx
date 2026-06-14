"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trophy, User, X } from "lucide-react";
import { useGroups, useSquad, useTeams } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { CardListSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import type { Standing } from "@/lib/types";

const MAX = 11;
const sep = "|";

export default function FantasyPage() {
  const hydrated = useHydrated();
  const { data: teamsData } = useTeams();
  const { data: groupsData } = useGroups();
  const fantasy = useAppStore((s) => s.fantasy);
  const setFantasy = useAppStore((s) => s.setFantasy);
  const [team, setTeam] = useState("");

  const teams = teamsData?.teams ?? [];
  const standings = useMemo(() => {
    const m = new Map<string, Standing>();
    for (const g of groupsData?.groups ?? [])
      for (const s of g.standings) m.set(s.team.id, s);
    return m;
  }, [groupsData]);

  const picks = hydrated ? fantasy : [];

  // Proxy score: each player earns their national team's group points + max(0, GD).
  const score = useMemo(() => {
    let total = 0;
    for (const id of picks) {
      const code = id.split(sep)[0];
      const s = standings.get(code);
      if (s) total += s.points * 2 + Math.max(0, s.goalDifference);
    }
    return total;
  }, [picks, standings]);

  function toggle(id: string) {
    if (picks.includes(id)) setFantasy(picks.filter((p) => p !== id));
    else if (picks.length < MAX) setFantasy([...picks, id]);
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Fantasy</h1>
        <p className="text-sm text-muted">
          Composez votre XI. Score basé sur les performances des sélections de vos
          joueurs.
        </p>
      </header>

      <div className="flex items-center justify-between border border-gold bg-gold/10 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-gold" size={24} />
          <div>
            <div className="text-[11px] font-bold uppercase text-gold">
              Score fantasy
            </div>
            <div className="text-2xl font-extrabold tabular-nums">{score}</div>
          </div>
        </div>
        <div className="text-right text-xs text-muted">
          {picks.length}/{MAX} joueurs
        </div>
      </div>

      {/* Selected XI */}
      {picks.length > 0 && (
        <div className="border border-border bg-surface p-3">
          <h2 className="mb-2 text-xs font-bold uppercase text-muted">Mon XI</h2>
          <div className="flex flex-wrap gap-1.5">
            {picks.map((id) => {
              const [code, name] = id.split(sep);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className="inline-flex items-center gap-1 border border-border bg-surface-2 px-2 py-1 text-xs"
                >
                  <span>{teams.find((t) => t.id === code)?.flag}</span>
                  {name}
                  <X size={11} className="text-muted" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Ajouter des joueurs d&apos;une équipe
        </label>
        <select
          aria-label="Choisir une équipe"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-full border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">— Choisir une équipe —</option>
          {[...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
      </div>

      {team && (
        <SquadPicker
          code={team}
          picks={picks}
          onToggle={toggle}
          full={picks.length >= MAX}
        />
      )}
    </div>
  );
}

function SquadPicker({
  code,
  picks,
  onToggle,
  full,
}: {
  code: string;
  picks: string[];
  onToggle: (id: string) => void;
  full: boolean;
}) {
  const { data, isLoading } = useSquad(code);
  if (isLoading) return <CardListSkeleton count={3} />;
  const players = data?.players ?? [];
  if (!players.length)
    return (
      <p className="text-center text-xs text-muted">
        Effectif indisponible pour cette équipe.
      </p>
    );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {players.map((p) => {
        const id = `${code}${sep}${p.name}`;
        const picked = picks.includes(id);
        const disabled = full && !picked;
        return (
          <button
            key={p.id}
            onClick={() => onToggle(id)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 border p-2 text-left text-xs transition-colors",
              picked
                ? "border-primary bg-primary/15 font-bold"
                : "border-border hover:border-primary",
              disabled && "opacity-40"
            )}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden border border-border bg-surface-2">
              {p.thumb ? (
                <Image
                  src={p.thumb}
                  alt={p.name}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <User size={14} className="text-muted" />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            {picked ? (
              <X size={12} className="text-primary" />
            ) : (
              <Plus size={12} className="text-muted" />
            )}
          </button>
        );
      })}
    </div>
  );
}
