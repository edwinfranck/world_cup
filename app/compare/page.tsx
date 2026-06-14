"use client";

import { useMemo, useState } from "react";
import { useGroups, useSquad, useTeams } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { Select } from "@/components/ui/select";
import { CardListSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import type { Standing, Team } from "@/lib/types";

type Mode = "teams" | "players";

export default function ComparePage() {
  const [mode, setMode] = useState<Mode>("teams");
  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Comparateur</h1>
        <p className="text-sm text-muted">Face à face équipes ou joueurs.</p>
      </header>

      <div className="flex gap-0 border border-border">
        {(["teams", "players"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted hover:text-foreground"
            )}
          >
            {m === "teams" ? "Équipes" : "Joueurs"}
          </button>
        ))}
      </div>

      {mode === "teams" ? <TeamCompare /> : <PlayerCompare />}
    </div>
  );
}

function TeamSelect({
  teams,
  value,
  onChange,
  label,
}: {
  teams: Team[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <Select
      ariaLabel={label}
      value={value}
      onChange={onChange}
      placeholder={label}
      searchable
      options={[...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ value: t.id, label: t.name }))}
    />
  );
}

function TeamCompare() {
  const { data: teamsData } = useTeams();
  const { data: groupsData, isLoading } = useGroups();
  const teams = teamsData?.teams ?? [];
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const standings = useMemo(() => {
    const map = new Map<string, Standing>();
    for (const g of groupsData?.groups ?? [])
      for (const s of g.standings) map.set(s.team.id, s);
    return map;
  }, [groupsData]);

  const ta = teams.find((t) => t.id === a);
  const tb = teams.find((t) => t.id === b);
  const sa = a ? standings.get(a) : undefined;
  const sb = b ? standings.get(b) : undefined;

  if (isLoading) return <CardListSkeleton count={4} />;

  const rows: { label: string; a: number; b: number; higherWins?: boolean }[] = [
    { label: "Points", a: sa?.points ?? 0, b: sb?.points ?? 0, higherWins: true },
    { label: "Joués", a: sa?.played ?? 0, b: sb?.played ?? 0 },
    { label: "Victoires", a: sa?.won ?? 0, b: sb?.won ?? 0, higherWins: true },
    { label: "Nuls", a: sa?.draw ?? 0, b: sb?.draw ?? 0 },
    { label: "Défaites", a: sa?.lost ?? 0, b: sb?.lost ?? 0, higherWins: false },
    { label: "Buts pour", a: sa?.goalsFor ?? 0, b: sb?.goalsFor ?? 0, higherWins: true },
    { label: "Buts contre", a: sa?.goalsAgainst ?? 0, b: sb?.goalsAgainst ?? 0, higherWins: false },
    { label: "Différence", a: sa?.goalDifference ?? 0, b: sb?.goalDifference ?? 0, higherWins: true },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <TeamSelect teams={teams} value={a} onChange={setA} label="Équipe A" />
        <TeamSelect teams={teams} value={b} onChange={setB} label="Équipe B" />
      </div>

      {ta && tb && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <TeamHead team={ta} pos={sa?.position} />
            <TeamHead team={tb} pos={sb?.position} />
          </div>
          <div className="border border-border bg-surface">
            {rows.map((r) => (
              <CompareRow key={r.label} {...r} />
            ))}
          </div>
        </>
      )}
      {(!ta || !tb) && (
        <p className="text-center text-sm text-muted">
          Choisissez deux équipes à comparer.
        </p>
      )}
    </div>
  );
}

function TeamHead({ team, pos }: { team: Team; pos?: number }) {
  return (
    <div className="flex flex-col items-center gap-1 border border-border bg-surface p-3 text-center">
      <TeamFlag team={team} size="lg" />
      <span className="text-sm font-bold leading-tight">{team.name}</span>
      <span className="text-[11px] text-muted">
        Gr. {team.groupId}
        {pos ? ` · ${pos}e` : ""}
      </span>
    </div>
  );
}

function CompareRow({
  label,
  a,
  b,
  higherWins,
}: {
  label: string;
  a: number;
  b: number;
  higherWins?: boolean;
}) {
  const aWin =
    higherWins === undefined ? false : higherWins ? a > b : a < b;
  const bWin =
    higherWins === undefined ? false : higherWins ? b > a : b < a;
  return (
    <div className="grid grid-cols-3 items-center border-b border-border/60 px-3 py-2 text-sm last:border-0">
      <span className={cn("text-left font-bold tabular-nums", aWin && "text-primary")}>
        {a}
      </span>
      <span className="text-center text-[11px] uppercase text-muted">{label}</span>
      <span className={cn("text-right font-bold tabular-nums", bWin && "text-primary")}>
        {b}
      </span>
    </div>
  );
}

/* ----------------------------- Players ----------------------------- */

function PlayerCompare() {
  const { data: teamsData } = useTeams();
  const teams = teamsData?.teams ?? [];
  const [ta, setTa] = useState("");
  const [tb, setTb] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <TeamSelect teams={teams} value={ta} onChange={setTa} label="Équipe A" />
        <TeamSelect teams={teams} value={tb} onChange={setTb} label="Équipe B" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PlayerPicker code={ta} />
        <PlayerPicker code={tb} />
      </div>
      <p className="text-center text-[11px] text-muted">
        Données joueurs : effectifs FIFA / TheSportsDB (gratuit).
      </p>
    </div>
  );
}

function PlayerPicker({ code }: { code: string }) {
  const { data, isLoading } = useSquad(code);
  const players = data?.players ?? [];
  const [sel, setSel] = useState("");
  const player = players.find((p) => p.id === sel);

  if (!code)
    return (
      <div className="grid h-40 place-items-center border border-dashed border-border bg-surface/50 text-xs text-muted">
        Choisir une équipe
      </div>
    );
  if (isLoading)
    return <div className="h-40 border border-border bg-surface-2 animate-pulse" />;

  return (
    <div className="border border-border bg-surface p-3">
      <Select
        ariaLabel="Choisir un joueur"
        value={sel}
        onChange={setSel}
        placeholder="— Joueur —"
        searchable
        size="sm"
        triggerClassName="bg-surface-2"
        className="mb-2"
        options={players.map((p) => ({ value: p.id, label: p.name }))}
      />
      {player && (
        <div className="flex flex-col items-center gap-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {player.thumb && (
            <img
              src={player.thumb}
              alt={player.name}
              className="h-16 w-16 border border-border object-cover"
            />
          )}
          <span className="text-sm font-bold leading-tight">{player.name}</span>
          <span className="text-[11px] text-muted">{player.position ?? "—"}</span>
          <span className="text-[11px] text-muted">{player.club ?? ""}</span>
          {player.number && (
            <span className="text-[11px] text-muted">N° {player.number}</span>
          )}
        </div>
      )}
    </div>
  );
}
