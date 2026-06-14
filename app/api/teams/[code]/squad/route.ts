import { NextResponse } from "next/server";
import { fetchSquad } from "@/lib/data/players-sportsdb";

// Squads change rarely — cache for a day.
export const revalidate = 86400;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const players = await fetchSquad(code.toUpperCase());
  return NextResponse.json(
    { players, source: "thesportsdb" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
