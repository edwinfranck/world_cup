"use client";

import { useMemo, useState } from "react";
import { Dices, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useGroups, useTeams } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { TeamFlag } from "@/components/team-flag";
import { Select } from "@/components/ui/select";
import { CardListSkeleton } from "@/components/ui/states";
import {
  KO_MATCHES,
  KO_STAGES,
  autofillPicks,
  champion,
  labelFr,
  resolveBracket,
  teamPath,
  type ResolvedMatch,
} from "@/lib/bracket";
import { STAGE_LABELS, type Stage, type Team } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BracketPage() {
  const hydrated = useHydrated();
  const { data: groupsData, isLoading } = useGroups();
  const { data: teamsData } = useTeams();
  const picks = useAppStore((s) => s.bracketPicks);
  const setPick = useAppStore((s) => s.setBracketPick);
  const setPicks = useAppStore((s) => s.setBracketPicks);
  const resetBracket = useAppStore((s) => s.resetBracket);
  const [pathTeam, setPathTeam] = useState("");

  const groups = groupsData?.groups ?? [];
  const teams = teamsData?.teams ?? [];
  const resolved = useMemo(
    () => resolveBracket(groups, hydrated ? picks : {}),
    [groups, picks, hydrated]
  );
  const champ = champion(resolved);

  const path = useMemo(
    () => (pathTeam ? teamPath(resolved, pathTeam) : new Set<string>()),
    [resolved, pathTeam]
  );

  if (isLoading || !hydrated) return <CardListSkeleton count={8} />;

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Simulateur de phase finale</h1>
        <p className="text-sm text-muted">
          Choisis le vainqueur de chaque match : le tableau se recalcule jusqu&apos;au
          champion. Basé sur les qualifiés projetés des groupes.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPicks(autofillPicks(groups, "seed"))}
          className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-bold transition-colors hover:border-primary hover:text-primary"
        >
          <Sparkles size={14} /> Favoris
        </button>
        <button
          onClick={() => setPicks(autofillPicks(groups, "random"))}
          className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-bold transition-colors hover:border-accent hover:text-accent"
        >
          <Dices size={14} /> Aléatoire
        </button>
        <button
          onClick={resetBracket}
          className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-bold text-muted transition-colors hover:text-live"
        >
          <RotateCcw size={14} /> Réinitialiser
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-muted">Parcours :</label>
        <Select
          ariaLabel="Choisir une équipe pour voir son parcours"
          value={pathTeam}
          onChange={setPathTeam}
          placeholder="— Choisir une équipe —"
          searchable
          className="flex-1"
          options={[...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t) => ({ value: t.id, label: t.name }))}
        />
      </div>
      {pathTeam && !path.size && (
        <p className="text-xs text-muted">
          {teams.find((t) => t.id === pathTeam)?.name} n&apos;atteint pas (encore)
          la phase finale dans cette simulation.
        </p>
      )}

      {champ && (
        <div className="flex items-center gap-3 border border-gold bg-gold/10 p-4">
          <Trophy className="text-gold" size={28} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-gold">
              Champion du monde
            </div>
            <div className="flex items-center gap-2 text-lg font-extrabold">
              <TeamFlag team={champ} size="md" /> {champ.name}
            </div>
          </div>
        </div>
      )}

      {KO_STAGES.map((stage) => {
        const matches = KO_MATCHES.filter((m) => m.stage === stage);
        if (!matches.length) return null;
        return (
          <section key={stage}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
              {STAGE_LABELS[stage]}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {matches.map((m) => (
                <TieCard
                  key={m.id}
                  id={m.id}
                  stage={stage}
                  resolved={resolved.get(m.id)}
                  homeLabel={m.homeLabel}
                  awayLabel={m.awayLabel}
                  pick={picks[m.id]}
                  onPick={(side) => setPick(m.id, side)}
                  highlight={path.has(m.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TieCard({
  id,
  stage,
  resolved,
  homeLabel,
  awayLabel,
  pick,
  onPick,
  highlight,
}: {
  id: string;
  stage: Stage;
  resolved?: ResolvedMatch;
  homeLabel: string;
  awayLabel: string;
  pick?: "home" | "away";
  onPick: (side: "home" | "away") => void;
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        "border bg-surface",
        highlight ? "border-gold" : "border-border"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-2 py-1 text-[10px] font-semibold uppercase text-muted">
        <span>M{id}</span>
        <span>{STAGE_LABELS[stage]}</span>
      </div>
      <Slot
        team={resolved?.home ?? null}
        fallback={labelFr(homeLabel)}
        selected={pick === "home"}
        dimmed={!!pick && pick !== "home"}
        onClick={() => resolved?.home && onPick("home")}
      />
      <div className="border-t border-border/60" />
      <Slot
        team={resolved?.away ?? null}
        fallback={labelFr(awayLabel)}
        selected={pick === "away"}
        dimmed={!!pick && pick !== "away"}
        onClick={() => resolved?.away && onPick("away")}
      />
    </div>
  );
}

function Slot({
  team,
  fallback,
  selected,
  dimmed,
  onClick,
}: {
  team: Team | null;
  fallback: string;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  const clickable = !!team;
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm transition-colors",
        selected && "bg-primary/15 font-bold",
        dimmed && "opacity-40",
        clickable ? "hover:bg-surface-2" : "cursor-default"
      )}
    >
      {team ? (
        <>
          <TeamFlag team={team} size="sm" />
          <span className="min-w-0 flex-1 truncate">{team.name}</span>
          {selected && (
            <span className="text-[10px] font-bold text-primary">✓ qualifié</span>
          )}
        </>
      ) : (
        <span className="truncate text-xs italic text-muted">{fallback}</span>
      )}
    </button>
  );
}
