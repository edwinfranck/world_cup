import { NextResponse } from "next/server";
import { fetchPlayer } from "@/lib/data/players-sportsdb";

export const revalidate = 86400;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = await fetchPlayer(id);
  if (!player) {
    return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });
  }
  return NextResponse.json(
    { player },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
