import type { MatchStatus } from "@/lib/types";
import { TEAMS } from "@/lib/data/worldcup-2026";

/**
 * REAL match results & live scores from TheSportsDB (free public key).
 * The FIFA World Cup league id is 4429. We combine a few free endpoints to
 * cover finished + in-play + imminent matches, then expose them keyed by the
 * pair of FIFA codes so the hybrid provider can overlay them onto the real
 * fixture schedule. Anything not covered stays SCHEDULED — never simulated.
 */

const KEY = process.env.SPORTSDB_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;
const LEAGUE_ID = "4429";

export interface LiveResult {
  eventId?: string;
  homeCode: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  minute?: number;
}

interface SdbEvent {
  idEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  dateEvent?: string | null;
}

// Normalise a team name for fuzzy matching (lowercase, strip accents/punct).
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

// Names where TheSportsDB differs from our dataset's English name.
const NAME_OVERRIDE: Record<string, string> = {
  usa: "USA",
  bosniaherzegovina: "BIH",
  drcongo: "COD",
  republicofcongo: "COD",
  capeverdeislands: "CPV",
  irananran: "IRN",
};

let _nameToCode: Map<string, string> | null = null;
function nameToCode(): Map<string, string> {
  if (_nameToCode) return _nameToCode;
  const m = new Map<string, string>();
  for (const t of TEAMS) m.set(norm(t.nameEn), t.code);
  for (const [k, v] of Object.entries(NAME_OVERRIDE)) m.set(k, v);
  _nameToCode = m;
  return m;
}

function codeFor(name?: string | null): string | null {
  if (!name) return null;
  return nameToCode().get(norm(name)) ?? null;
}

function mapStatus(raw?: string | null): { status: MatchStatus; minute?: number } {
  const s = (raw ?? "").toUpperCase();
  if (["FT", "AET", "PEN", "MATCH FINISHED", "FINISHED"].some((x) => s.includes(x)))
    return { status: "FINISHED" };
  if (s === "HT" || s.includes("HALF TIME")) return { status: "PAUSED" };
  if (
    s === "1H" ||
    s === "2H" ||
    s === "ET" ||
    s === "LIVE" ||
    s.includes("PLAY")
  ) {
    return { status: "LIVE" };
  }
  // Numeric progress like "63" => live at minute 63.
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n > 0 && n <= 130) return { status: "LIVE", minute: n };
  return { status: "SCHEDULED" };
}

function toResult(e: SdbEvent): LiveResult | null {
  const homeCode = codeFor(e.strHomeTeam);
  const awayCode = codeFor(e.strAwayTeam);
  if (!homeCode || !awayCode) return null;
  const { status, minute } = mapStatus(e.strStatus ?? e.strProgress);
  const progressMin = e.strProgress ? parseInt(e.strProgress, 10) : NaN;
  return {
    eventId: e.idEvent ?? undefined,
    homeCode,
    awayCode,
    homeScore: e.intHomeScore != null ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null ? Number(e.intAwayScore) : null,
    status,
    minute: minute ?? (!Number.isNaN(progressMin) ? progressMin : undefined),
  };
}

async function fetchEvents(path: string): Promise<SdbEvent[]> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: SdbEvent[] | null };
    return data.events ?? [];
  } catch {
    return [];
  }
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

/** Real results keyed by sorted code pair. Latest status wins on dedupe. */
export async function fetchLiveResults(): Promise<Map<string, LiveResult>> {
  const [season, past, next] = await Promise.all([
    fetchEvents(`/eventsseason.php?id=${LEAGUE_ID}&s=2026`),
    fetchEvents(`/eventspastleague.php?id=${LEAGUE_ID}`),
    fetchEvents(`/eventsnextleague.php?id=${LEAGUE_ID}`),
  ]);

  const map = new Map<string, LiveResult>();
  // Order matters: season (finished) first, then past/live, so live overwrites.
  for (const ev of [...season, ...next, ...past]) {
    const r = toResult(ev);
    if (!r) continue;
    map.set(pairKey(r.homeCode, r.awayCode), r);
  }
  return map;
}
