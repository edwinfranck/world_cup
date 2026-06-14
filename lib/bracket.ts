import type { Group, Stage, Team } from "@/lib/types";
import { RAW_MATCHES } from "@/lib/data/worldcup-2026";

/**
 * Knockout bracket model + simulator engine.
 * The fixture data carries slot labels ("Winner Group A", "Runner-up Group B",
 * "3rd Group A/B/C/D/F", "Winner Match 73", "Loser Match 101"). We resolve those
 * against projected group standings + the user's winner picks to compute the
 * whole bracket (incl. the champion) reactively.
 */

export interface KoMatch {
  id: string;
  stage: Stage;
  utcDate: string;
  homeLabel: string;
  awayLabel: string;
}

export const KO_MATCHES: KoMatch[] = RAW_MATCHES.filter(
  (m) => m.stage !== "GROUP"
).map((m) => ({
  id: m.id,
  stage: m.stage,
  utcDate: m.utcDate,
  homeLabel: m.homeLabel ?? "",
  awayLabel: m.awayLabel ?? "",
}));

export const KO_STAGES: Stage[] = [
  "ROUND_32",
  "ROUND_16",
  "QUARTER",
  "SEMI",
  "THIRD_PLACE",
  "FINAL",
];

export type Picks = Record<string, "home" | "away">;

export interface ResolvedMatch {
  home: Team | null;
  away: Team | null;
  winner: Team | null;
  loser: Team | null;
}

/** Human, French label for an unresolved slot. */
export function labelFr(label: string): string {
  let m;
  if ((m = label.match(/Winner Group ([A-L])/))) return `1er Gr. ${m[1]}`;
  if ((m = label.match(/Runner-up Group ([A-L])/))) return `2e Gr. ${m[1]}`;
  if ((m = label.match(/3rd Group ([A-L/]+)/))) return `3e (${m[1]})`;
  if ((m = label.match(/Winner Match (\d+)/))) return `Vainqueur M${m[1]}`;
  if ((m = label.match(/Loser Match (\d+)/))) return `Perdant M${m[1]}`;
  return label;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Resolve every knockout match's teams given group standings + picks.
 * Returns a map matchId -> ResolvedMatch.
 */
export function resolveBracket(groups: Group[], picks: Picks): Map<string, ResolvedMatch> {
  const byGroup = new Map(groups.map((g) => [g.id, g]));
  const winnerOfGroup = (g: string) => byGroup.get(g)?.standings[0]?.team ?? null;
  const runnerOfGroup = (g: string) => byGroup.get(g)?.standings[1]?.team ?? null;

  // Rank all third-placed teams; the best 8 advance (WC 2026 format).
  const thirds = groups
    .map((g) => g.standings[2])
    .filter(Boolean)
    .map((s) => ({ groupId: s.team.groupId ?? "", team: s.team, s }))
    .sort(
      (a, b) =>
        b.s.points - a.s.points ||
        b.s.goalDifference - a.s.goalDifference ||
        b.s.goalsFor - a.s.goalsFor
    )
    .slice(0, 8);
  const usedThirdGroups = new Set<string>();
  const assignThird = (eligible: string[]): Team | null => {
    for (const t of thirds) {
      if (eligible.includes(t.groupId) && !usedThirdGroups.has(t.groupId)) {
        usedThirdGroups.add(t.groupId);
        return t.team;
      }
    }
    return null;
  };

  const res = new Map<string, ResolvedMatch>();
  const resolveLabel = (label: string): Team | null => {
    let m;
    if ((m = label.match(/Winner Group ([A-L])/))) return winnerOfGroup(m[1]);
    if ((m = label.match(/Runner-up Group ([A-L])/))) return runnerOfGroup(m[1]);
    if ((m = label.match(/3rd Group ([A-L/]+)/))) return assignThird(m[1].split("/"));
    if ((m = label.match(/Winner Match (\d+)/))) return res.get(m[1])?.winner ?? null;
    if ((m = label.match(/Loser Match (\d+)/))) return res.get(m[1])?.loser ?? null;
    return null;
  };

  for (const ko of [...KO_MATCHES].sort((a, b) => Number(a.id) - Number(b.id))) {
    const home = resolveLabel(ko.homeLabel);
    const away = resolveLabel(ko.awayLabel);
    const pick = picks[ko.id];
    const winner = pick === "home" ? home : pick === "away" ? away : null;
    const loser = pick === "home" ? away : pick === "away" ? home : null;
    res.set(ko.id, { home, away, winner, loser });
  }
  return res;
}

/** Auto-fill every pick. mode "seed" = higher seed (home), "random" = deterministic coin. */
export function autofillPicks(groups: Group[], mode: "seed" | "random"): Picks {
  const picks: Picks = {};
  for (const ko of [...KO_MATCHES].sort((a, b) => Number(a.id) - Number(b.id))) {
    const r = resolveBracket(groups, picks).get(ko.id);
    if (!r) continue;
    let side: "home" | "away" | null = null;
    if (r.home && r.away)
      side = mode === "random" ? (hash(ko.id) % 2 ? "home" : "away") : "home";
    else if (r.home) side = "home";
    else if (r.away) side = "away";
    if (side) picks[ko.id] = side;
  }
  return picks;
}

/** Set of match ids in which a given team appears (its path through the bracket). */
export function teamPath(resolved: Map<string, ResolvedMatch>, code: string): Set<string> {
  const set = new Set<string>();
  for (const [id, r] of resolved) {
    if (r.home?.code === code || r.away?.code === code) set.add(id);
  }
  return set;
}

export function champion(resolved: Map<string, ResolvedMatch>): Team | null {
  return resolved.get("104")?.winner ?? null;
}
