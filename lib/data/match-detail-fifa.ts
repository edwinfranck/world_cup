import type {
  LineupPlayer,
  MatchEvent,
  MatchLineups,
  MatchStatus,
  TeamLineup,
} from "@/lib/types";

/**
 * FIFA MatchStatus codes (observed): 0 = finished (full time), 1 = not started,
 * 3 = live / in progress. MatchTime carries the clock ("29'", "90'+4'").
 */
function fifaStatus(
  ms: number | undefined,
  matchTime: string | undefined
): { status: MatchStatus; minute?: number; clock?: string } {
  if (ms === 0) return { status: "FINISHED" };
  if (ms === 3) {
    const clock = matchTime || undefined;
    const min = clock ? parseInt(clock, 10) : NaN;
    return {
      status: clock && /half\s*time|^ht$/i.test(clock) ? "PAUSED" : "LIVE",
      clock,
      minute: Number.isNaN(min) ? undefined : min,
    };
  }
  return { status: "SCHEDULED" };
}

/**
 * Match detail from FIFA's own public JSON API (api.fifa.com/api/v3) — keyless
 * and COMPLETE: full 26-player squads, formations, goal scorers (+assists),
 * cards and substitutions. This is exactly the FIFA source the user asked for.
 *
 * Competition 17 = "FIFA World Cup", Season 285023 = 2026 edition. It's an
 * undocumented internal API behind Akamai, so we send a browser User-Agent,
 * cache aggressively, and the caller falls back to TheSportsDB on any failure.
 */

const BASE = "https://api.fifa.com/api/v3";
const COMPETITION = "17";
const SEASON = "285023";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const POSITION_LABEL: Record<number, string> = {
  0: "Gardien",
  1: "Défenseur",
  2: "Milieu",
  3: "Attaquant",
};

type Localized = string | { Locale?: string; Description?: string }[] | null;

function loc(v: Localized | undefined): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    const en = v.find((x) => (x.Locale ?? "").startsWith("en"));
    return (en ?? v[0])?.Description;
  }
  return undefined;
}

function parseMinute(m?: string | null): number {
  if (!m) return 0;
  const main = parseInt(m, 10);
  if (Number.isNaN(main)) return 0;
  const extra = m.match(/\+\s*(\d+)/);
  return main + (extra ? parseInt(extra[1], 10) : 0);
}

async function fifaFetch<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface FifaCalMatch {
  IdMatch?: string;
  IdStage?: string;
  MatchNumber?: number;
  MatchStatus?: number;
  MatchTime?: string;
  Date?: string;
  Home?: { IdCountry?: string; Score?: number | null };
  Away?: { IdCountry?: string; Score?: number | null };
}

const FULL_CALENDAR = `/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=150&from=2026-06-01T00:00:00Z&to=2026-07-31T00:00:00Z`;

/**
 * Authoritative kickoff date/time for EVERY match, keyed by FIFA MatchNumber
 * (which equals our schedule's match id 1..104). Our seed times are timezone
 * -offset, so we override them all with these.
 */
export async function fetchFifaDates(): Promise<Map<number, string>> {
  const data = await fifaFetch<{ Results?: FifaCalMatch[] }>(FULL_CALENDAR, 1800);
  const map = new Map<number, string>();
  for (const m of data?.Results ?? []) {
    if (m.MatchNumber && m.Date) map.set(m.MatchNumber, m.Date);
  }
  return map;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("-");
}

export interface FifaResult {
  homeCode: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  minute?: number;
  clock?: string;
  date?: string;
}

function dayStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Authoritative scores + LIVE status + minute for matches in a window around
 * now, straight from FIFA's calendar (one call). Keyed by sorted code pair.
 * The window is quantised to whole days so the URL (and cache) is stable.
 */
export async function fetchFifaResults(): Promise<Map<string, FifaResult>> {
  const now = Date.now();
  const from = `${dayStr(now - 6 * 86400000)}T00:00:00Z`;
  const to = `${dayStr(now + 4 * 86400000)}T00:00:00Z`;
  const data = await fifaFetch<{ Results?: FifaCalMatch[] }>(
    `/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=80&from=${from}&to=${to}`,
    15
  );
  const map = new Map<string, FifaResult>();
  for (const m of data?.Results ?? []) {
    const h = m.Home?.IdCountry;
    const a = m.Away?.IdCountry;
    if (!h || !a) continue;
    const st = fifaStatus(m.MatchStatus, m.MatchTime || undefined);
    map.set(pairKey(h, a), {
      homeCode: h,
      awayCode: a,
      homeScore: m.Home?.Score ?? null,
      awayScore: m.Away?.Score ?? null,
      status: st.status,
      minute: st.minute,
      clock: st.clock,
      date: m.Date || undefined,
    });
  }
  return map;
}

interface CalRef {
  idMatch: string;
  idStage: string;
  fifaHomeCode: string;
}

/** Map of "code-code" -> calendar ref for the whole tournament. */
async function calendarIndex(): Promise<Map<string, CalRef>> {
  const data = await fifaFetch<{ Results?: FifaCalMatch[] }>(
    `/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=150&from=2026-06-01T00:00:00Z&to=2026-07-31T00:00:00Z`,
    1800
  );
  const map = new Map<string, CalRef>();
  for (const m of data?.Results ?? []) {
    const h = m.Home?.IdCountry;
    const a = m.Away?.IdCountry;
    if (h && a && m.IdMatch && m.IdStage) {
      map.set(pairKey(h, a), {
        idMatch: m.IdMatch,
        idStage: m.IdStage,
        fifaHomeCode: h,
      });
    }
  }
  return map;
}

interface FifaPlayer {
  IdPlayer?: string;
  ShirtNumber?: number;
  Status?: number; // 1 = starter, 2 = bench
  Captain?: boolean;
  PlayerName?: Localized;
  ShortName?: Localized;
  Position?: number;
  PlayerPicture?: { PictureUrl?: string } | null;
}
interface FifaGoal {
  IdPlayer?: string;
  IdAssistPlayer?: string;
  Minute?: string;
  Type?: number;
}
interface FifaBooking {
  IdPlayer?: string;
  Card?: number; // 1 = yellow, 2 = red
  Minute?: string;
}
interface FifaSub {
  PlayerOffName?: Localized;
  PlayerOnName?: Localized;
  Minute?: string;
}
interface FifaTeam {
  Score?: number;
  Tactics?: string;
  Players?: FifaPlayer[];
  Goals?: FifaGoal[];
  Bookings?: FifaBooking[];
  Substitutions?: FifaSub[];
}
interface FifaDetail {
  HomeTeam?: FifaTeam;
  AwayTeam?: FifaTeam;
  MatchStatus?: number; // 3 = finished
  MatchTime?: string; // "67'", "90'+4'"
}

function buildTeamEvents(
  team: FifaTeam,
  side: "home" | "away"
): MatchEvent[] {
  const names = new Map<string, string>();
  for (const p of team.Players ?? []) {
    const n = loc(p.PlayerName) ?? loc(p.ShortName);
    if (p.IdPlayer && n) names.set(p.IdPlayer, n);
  }
  const events: MatchEvent[] = [];

  for (const g of team.Goals ?? []) {
    events.push({
      minute: parseMinute(g.Minute),
      type: "GOAL",
      side,
      player: g.IdPlayer ? names.get(g.IdPlayer) : undefined,
      assist: g.IdAssistPlayer ? names.get(g.IdAssistPlayer) : undefined,
    });
  }
  for (const b of team.Bookings ?? []) {
    events.push({
      minute: parseMinute(b.Minute),
      type: b.Card === 2 ? "RED" : "YELLOW",
      side,
      player: b.IdPlayer ? names.get(b.IdPlayer) : undefined,
    });
  }
  for (const s of team.Substitutions ?? []) {
    const on = loc(s.PlayerOnName);
    const off = loc(s.PlayerOffName);
    events.push({
      minute: parseMinute(s.Minute),
      type: "SUB",
      side,
      player: on,
      detail: off ? `Sort : ${off}` : undefined,
    });
  }
  return events;
}

function buildTeamLineup(team: FifaTeam): TeamLineup {
  const toPlayer = (p: FifaPlayer): LineupPlayer => ({
    name: loc(p.PlayerName) ?? loc(p.ShortName) ?? "—",
    number: p.ShirtNumber != null ? String(p.ShirtNumber) : undefined,
    position: p.Position != null ? POSITION_LABEL[p.Position] : undefined,
    starter: p.Status === 1,
    captain: !!p.Captain,
    photo: p.PlayerPicture?.PictureUrl || undefined,
  });
  const players = (team.Players ?? []).map(toPlayer);
  const byPos = (a: LineupPlayer, b: LineupPlayer) =>
    Number(a.number ?? 99) - Number(b.number ?? 99);
  return {
    formation: typeof team.Tactics === "string" ? team.Tactics : undefined,
    starters: players.filter((p) => p.starter).sort(byPos),
    bench: players.filter((p) => !p.starter).sort(byPos),
  };
}

export interface FifaMatchDetail {
  events: MatchEvent[];
  lineups?: MatchLineups;
  clock?: string;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  live: boolean;
}

export async function fetchFifaMatchDetailByTeams(
  homeCode: string,
  awayCode: string
): Promise<FifaMatchDetail | null> {
  const index = await calendarIndex();
  const ref = index.get(pairKey(homeCode, awayCode));
  if (!ref) return null;

  const detail = await fifaFetch<FifaDetail>(
    `/live/football/${COMPETITION}/${SEASON}/${ref.idStage}/${ref.idMatch}`,
    30
  );
  if (!detail?.HomeTeam || !detail?.AwayTeam) return null;

  // Align FIFA's Home/Away to OUR fixture's home/away (guard against a swapped
  // orientation), using the FIFA home code captured from the calendar.
  const same = ref.fifaHomeCode === homeCode;
  const fifaHome = detail.HomeTeam;
  const fifaAway = detail.AwayTeam;
  const ourHome = same ? fifaHome : fifaAway;
  const ourAway = same ? fifaAway : fifaHome;

  const events = [
    ...buildTeamEvents(ourHome, "home"),
    ...buildTeamEvents(ourAway, "away"),
  ].sort((a, b) => a.minute - b.minute);

  const lineups: MatchLineups = {
    home: buildTeamLineup(ourHome),
    away: buildTeamLineup(ourAway),
  };
  const hasLineups =
    lineups.home.starters.length > 0 || lineups.away.starters.length > 0;

  const st = fifaStatus(detail.MatchStatus, detail.MatchTime || undefined);

  return {
    events,
    lineups: hasLineups ? lineups : undefined,
    clock: st.clock,
    homeScore: ourHome.Score ?? null,
    awayScore: ourAway.Score ?? null,
    finished: st.status === "FINISHED",
    live: st.status === "LIVE" || st.status === "PAUSED",
  };
}
