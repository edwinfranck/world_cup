import type { Group, Match, MatchStatus, Standing, Stage, Team } from "@/lib/types";
import {
  RAW_MATCHES,
  STADIUMS,
  TEAMS,
  type RawMatch,
} from "@/lib/data/worldcup-2026";

/**
 * Schedule + reference data backed by REAL, public-domain World Cup 2026 data
 * (openfootball / rezarahiminia): the official 48 teams, 16 stadiums and the
 * full 104-match schedule incl. the knockout bracket.
 *
 * IMPORTANT: this module no longer invents any scores. Every fixture is emitted
 * as SCHEDULED with null scores; real scores/live status are overlaid by the
 * hybrid provider from the live data source. Never display simulated results.
 */

/** ISO2 country code -> flag emoji (regional indicator pair). */
function flagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...[...iso2.toUpperCase()].map((c) => base + c.charCodeAt(0) - 65)
  );
}

let _teamsById: Map<string, Team> | null = null;
function teamsById(): Map<string, Team> {
  if (_teamsById) return _teamsById;
  const map = new Map<string, Team>();
  for (const t of TEAMS) {
    map.set(t.id, {
      id: t.code, // public-facing id is the FIFA code (stable, readable)
      name: t.name,
      code: t.code,
      flag: flagEmoji(t.iso2),
      crest: t.crest,
      groupId: t.groupId,
    });
  }
  _teamsById = map;
  return map;
}

/** Synthetic placeholder team for an unresolved knockout slot. */
function placeholder(label: string, slot: string): Team {
  return { id: `TBD-${slot}`, name: label, code: "?", flag: "🏳️" };
}

const stadiumById = new Map(STADIUMS.map((s) => [s.id, s]));
function venueOf(stadiumId: string): string | undefined {
  const s = stadiumById.get(stadiumId);
  return s ? `${s.name}, ${s.city}` : undefined;
}

function resolveTeam(raw: RawMatch, side: "home" | "away"): Team {
  const id = side === "home" ? raw.homeId : raw.awayId;
  const label = side === "home" ? raw.homeLabel : raw.awayLabel;
  if (id) {
    const t = teamsById().get(id);
    if (t) return t;
  }
  return placeholder(label ?? "À déterminer", `${raw.id}-${side}`);
}

let _matches: Match[] | null = null;

function buildMatches(): Match[] {
  const matches: Match[] = RAW_MATCHES.map((raw) => ({
    id: raw.id,
    stage: raw.stage,
    groupId: raw.groupId,
    utcDate: raw.utcDate,
    status: "SCHEDULED" as MatchStatus,
    venue: venueOf(raw.stadiumId),
    home: resolveTeam(raw, "home"),
    away: resolveTeam(raw, "away"),
    homeScore: null,
    awayScore: null,
  }));

  return matches.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
}

export function getSeedMatches(): Match[] {
  if (!_matches) _matches = buildMatches();
  return _matches;
}

export function getSeedTeams(): Team[] {
  return [...teamsById().values()].sort(
    (a, b) =>
      (a.groupId ?? "").localeCompare(b.groupId ?? "") ||
      a.name.localeCompare(b.name)
  );
}

export function getSeedTeam(code: string): Team | undefined {
  return getSeedTeams().find((t) => t.id === code);
}

/** Map FIFA code -> English country name (for external player-data lookups). */
export function englishNameFor(code: string): string | undefined {
  return TEAMS.find((t) => t.code === code)?.nameEn;
}

export function getSeedStadiums() {
  return STADIUMS;
}

/** Compute live group standings from finished/live match results. */
export function getSeedGroups(): Group[] {
  return computeGroups(getSeedMatches(), getSeedTeams());
}

/**
 * Pure standings computation from a set of matches. Used by both the seed
 * (empty schedule => all zeros) and the hybrid provider (real overlaid scores).
 */
export function computeGroups(matches: Match[], teams: Team[]): Group[] {
  const groupIds = [...new Set(teams.map((t) => t.groupId))]
    .filter((g): g is string => !!g)
    .sort();

  return groupIds.map((groupId) => {
    const table = new Map<string, Standing>();
    teams
      .filter((t) => t.groupId === groupId)
      .forEach((team, i) =>
        table.set(team.id, {
          team,
          position: i + 1,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        })
      );

    matches
      .filter(
        (m) =>
          m.groupId === groupId &&
          (m.status === "FINISHED" || m.status === "LIVE") &&
          m.homeScore !== null &&
          m.awayScore !== null &&
          table.has(m.home.id) &&
          table.has(m.away.id)
      )
      .forEach((m) => {
        const h = table.get(m.home.id)!;
        const a = table.get(m.away.id)!;
        h.played++;
        a.played++;
        h.goalsFor += m.homeScore!;
        h.goalsAgainst += m.awayScore!;
        a.goalsFor += m.awayScore!;
        a.goalsAgainst += m.homeScore!;
        if (m.homeScore! > m.awayScore!) {
          h.won++;
          h.points += 3;
          a.lost++;
        } else if (m.homeScore! < m.awayScore!) {
          a.won++;
          a.points += 3;
          h.lost++;
        } else {
          h.draw++;
          a.draw++;
          h.points++;
          a.points++;
        }
      });

    const standings = [...table.values()]
      .map((s) => ({ ...s, goalDifference: s.goalsFor - s.goalsAgainst }))
      .sort(
        (x, y) =>
          y.points - x.points ||
          y.goalDifference - x.goalDifference ||
          y.goalsFor - x.goalsFor ||
          x.team.name.localeCompare(y.team.name)
      )
      .map((s, i) => ({ ...s, position: i + 1 }));

    return { id: groupId, standings };
  });
}

export const STAGES_ORDER: Stage[] = [
  "GROUP",
  "ROUND_32",
  "ROUND_16",
  "QUARTER",
  "SEMI",
  "THIRD_PLACE",
  "FINAL",
];
