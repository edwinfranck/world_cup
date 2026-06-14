import { NextResponse } from "next/server";
import { getSeedStadiums } from "@/lib/data/seed";

// Stadiums are static reference data — cache hard.
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(
    { stadiums: getSeedStadiums() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
