import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data";
import {
  fetchMatchDetail,
  fetchStatRows,
} from "@/lib/data/match-detail-tsdb";
import { fetchFifaMatchDetailByTeams } from "@/lib/data/match-detail-fifa";
import { fetchApiFootballStatRows } from "@/lib/data/match-detail-apifootball";

export const revalidate = 30;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data: match, source } = await withFallback((p) => p.getMatch(id));
  if (!match) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  const teamsKnown = match.home.code !== "?" && match.away.code !== "?";

  // 1) FIFA's own API (keyless, COMPLETE lineups w/ photos + scorers + minute).
  if (teamsKnown) {
    try {
      const fifa = await fetchFifaMatchDetailByTeams(
        match.home.code,
        match.away.code
      );
      if (fifa) {
        if (fifa.events.length) match.events = fifa.events;
        if (fifa.lineups) match.lineups = fifa.lineups;
        // FIFA is authoritative for score/status/clock on the detail page.
        if (fifa.finished) {
          match.status = "FINISHED";
        } else if (fifa.live) {
          match.status = "LIVE";
          match.clock = fifa.clock;
        }
        if (fifa.homeScore !== null) match.homeScore = fifa.homeScore;
        if (fifa.awayScore !== null) match.awayScore = fifa.awayScore;
      }
    } catch {
      // fall through to TheSportsDB
    }
  }

  // 2) TheSportsDB fallback for anything FIFA didn't provide + stat bars.
  if (match.providerEventId) {
    try {
      if (!match.events?.length || !match.lineups) {
        const tsdb = await fetchMatchDetail(match.providerEventId);
        if (!match.events?.length && tsdb.events.length)
          match.events = tsdb.events;
        if (!match.lineups && tsdb.lineups) match.lineups = tsdb.lineups;
      }
      match.statRows = await fetchStatRows(match.providerEventId);
    } catch {
      // base match is enough
    }
  }

  // 3) Richer stats via API-Football when a key is configured (possession, etc.).
  if (teamsKnown) {
    try {
      const rich = await fetchApiFootballStatRows(
        match.home.code,
        match.away.code,
        match.utcDate
      );
      if (rich.length) match.statRows = rich;
    } catch {
      // keep TheSportsDB stats
    }
  }

  return NextResponse.json(
    { match, source },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
