import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data";

export const revalidate = 300;

export async function GET() {
  const { data, source } = await withFallback((p) => p.getTeams());
  return NextResponse.json(
    { teams: data, source },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
