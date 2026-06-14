import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data";
import { fetchMatchDetail, fetchStats } from "@/lib/data/match-detail-tsdb";
import { fetchFifaMatchDetailByTeams } from "@/lib/data/match-detail-fifa";

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

  // 1) Prefer FIFA's own API (keyless, COMPLETE 26-player lineups + scorers).
  if (teamsKnown) {
    try {
      const fifa = await fetchFifaMatchDetailByTeams(
        match.home.code,
        match.away.code
      );
      if (fifa) {
        if (fifa.events.length) match.events = fifa.events;
        if (fifa.lineups) match.lineups = fifa.lineups;
      }
    } catch {
      // ignore — fall through to TheSportsDB
    }
  }

  // 2) Fall back to TheSportsDB for anything FIFA didn't provide.
  if (match.providerEventId) {
    try {
      if (!match.events?.length || !match.lineups) {
        const tsdb = await fetchMatchDetail(match.providerEventId);
        if (!match.events?.length && tsdb.events.length) match.events = tsdb.events;
        if (!match.lineups && tsdb.lineups) match.lineups = tsdb.lineups;
        if (!match.stats && tsdb.stats) match.stats = tsdb.stats;
      } else if (!match.stats) {
        // FIFA covered events+lineups; still grab stat bars from TheSportsDB.
        match.stats = await fetchStats(match.providerEventId);
      }
    } catch {
      // ignore — base match is enough
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
