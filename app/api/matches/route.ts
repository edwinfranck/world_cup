import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data";

// Refresh fast so live minute/score stay close to real time.
export const revalidate = 15;

export async function GET() {
  const { data, source } = await withFallback((p) => p.getMatches());
  return NextResponse.json(
    { matches: data, source },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
      },
    }
  );
}
