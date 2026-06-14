import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data";

export const revalidate = 60;

export async function GET() {
  const { data, source } = await withFallback((p) => p.getGroups());
  return NextResponse.json(
    { groups: data, source },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
