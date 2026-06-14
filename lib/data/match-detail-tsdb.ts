import type {
  LineupPlayer,
  MatchEvent,
  MatchLineups,
  MatchStats,
} from "@/lib/types";

/**
 * Match detail (goal scorers, cards, subs, lineups, stats) from TheSportsDB,
 * keyed by the upstream event id carried on each Match (providerEventId).
 * Free public key works; a paid SPORTSDB_KEY lifts the free ~5-row cap.
 */

const KEY = process.env.SPORTSDB_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

interface SdbTimeline {
  intTime?: string | null;
  strTimeline?: string | null; // "Goal" | "Card" | "subst" | "var"
  strTimelineDetail?: string | null;
  strHome?: string | null; // "Yes" | "No"
  strPlayer?: string | null;
  strAssist?: string | null;
}

function eventType(t: SdbTimeline): MatchEvent["type"] | null {
  const kind = (t.strTimeline ?? "").toLowerCase();
  const detail = (t.strTimelineDetail ?? "").toLowerCase();
  if (kind === "goal") {
    if (detail.includes("own")) return "OWN_GOAL";
    if (detail.includes("penalty")) return "PENALTY";
    return "GOAL";
  }
  if (kind === "card") return detail.includes("red") ? "RED" : "YELLOW";
  if (kind.startsWith("subst")) return "SUB";
  if (kind === "var") return "VAR";
  return null;
}

export async function fetchTimeline(eventId: string): Promise<MatchEvent[]> {
  try {
    const res = await fetch(`${BASE}/lookuptimeline.php?id=${eventId}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { timeline?: SdbTimeline[] | null };
    const rows = data.timeline ?? [];
    return rows
      .map((t): MatchEvent | null => {
        const type = eventType(t);
        if (!type) return null;
        return {
          minute: t.intTime ? parseInt(t.intTime, 10) || 0 : 0,
          type,
          side: t.strHome === "Yes" ? "home" : "away",
          player: t.strPlayer || undefined,
          assist: t.strAssist || undefined,
          detail: t.strTimelineDetail || undefined,
        };
      })
      .filter((e): e is MatchEvent => e !== null)
      .sort((a, b) => a.minute - b.minute);
  } catch {
    return [];
  }
}

interface SdbLineup {
  strPosition?: string | null;
  strHome?: string | null;
  strSubstitute?: string | null; // "Yes" | "No"
  intSquadNumber?: string | null;
  strPlayer?: string | null;
}

export async function fetchLineups(
  eventId: string
): Promise<MatchLineups | undefined> {
  try {
    const res = await fetch(`${BASE}/lookuplineup.php?id=${eventId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { lineup?: SdbLineup[] | null };
    const rows = data.lineup ?? [];
    if (!rows.length) return undefined;

    const mk = (): { starters: LineupPlayer[]; bench: LineupPlayer[] } => ({
      starters: [],
      bench: [],
    });
    const home = mk();
    const away = mk();

    for (const r of rows) {
      if (!r.strPlayer) continue;
      const p: LineupPlayer = {
        name: r.strPlayer,
        number: r.intSquadNumber || undefined,
        position: r.strPosition || undefined,
        starter: r.strSubstitute !== "Yes",
      };
      const side = r.strHome === "Yes" ? home : away;
      (p.starter ? side.starters : side.bench).push(p);
    }

    return {
      home: { starters: home.starters, bench: home.bench },
      away: { starters: away.starters, bench: away.bench },
    };
  } catch {
    return undefined;
  }
}

interface SdbStat {
  strStat?: string | null;
  intHome?: string | null;
  intAway?: string | null;
}

export async function fetchStats(
  eventId: string
): Promise<MatchStats | undefined> {
  try {
    const res = await fetch(`${BASE}/lookupeventstats.php?id=${eventId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { eventstats?: SdbStat[] | null };
    const rows = data.eventstats ?? [];
    if (!rows.length) return undefined;
    const stats: MatchStats = {};
    const num = (v?: string | null) => (v != null ? Number(v) : undefined);
    for (const s of rows) {
      const key = (s.strStat ?? "").toLowerCase();
      if (key.includes("possession")) {
        stats.possessionHome = num(s.intHome);
        stats.possessionAway = num(s.intAway);
      } else if (key.includes("shots on")) {
        stats.shotsOnTargetHome = num(s.intHome);
        stats.shotsOnTargetAway = num(s.intAway);
      } else if (key.includes("shot")) {
        stats.shotsHome = num(s.intHome);
        stats.shotsAway = num(s.intAway);
      } else if (key.includes("corner")) {
        stats.cornersHome = num(s.intHome);
        stats.cornersAway = num(s.intAway);
      } else if (key.includes("foul")) {
        stats.foulsHome = num(s.intHome);
        stats.foulsAway = num(s.intAway);
      }
    }
    return Object.keys(stats).length ? stats : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchMatchDetail(eventId: string): Promise<{
  events: MatchEvent[];
  lineups?: MatchLineups;
  stats?: MatchStats;
}> {
  const [events, lineups, stats] = await Promise.all([
    fetchTimeline(eventId),
    fetchLineups(eventId),
    fetchStats(eventId),
  ]);
  return { events, lineups, stats };
}
