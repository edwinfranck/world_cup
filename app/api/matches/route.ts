import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data";

// Revalidate on the server every 30s; live matches refresh fast enough,
// finished/scheduled data barely changes — keeps us well under free-tier limits.
export const revalidate = 30;

export async function GET() {
  const { data, source } = await withFallback((p) => p.getMatches());
  return NextResponse.json(
    { matches: data, source },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
