import type { DataProvider } from "@/lib/data/provider";
import { seedProvider } from "@/lib/data/seed-provider";
import { footballDataProvider } from "@/lib/data/football-data-provider";
import { hybridProvider } from "@/lib/data/hybrid-provider";

/**
 * Resolve the active data provider.
 *
 * - With FOOTBALL_DATA_TOKEN set, use the free Football-Data.org API.
 * - Otherwise (the default), use the hybrid provider: the real fixture schedule
 *   with REAL scores/live status overlaid from TheSportsDB (free, no key). No
 *   scores are ever simulated.
 *
 * Every call falls back to the schedule (seed) on failure, so a rate-limit hit
 * or network error never produces an empty screen — it just omits live scores.
 */
export function getProvider(): DataProvider {
  if (process.env.FOOTBALL_DATA_TOKEN) return footballDataProvider;
  return hybridProvider;
}

/** Run a provider call, falling back to the seed provider on any error. */
export async function withFallback<T>(
  fn: (p: DataProvider) => Promise<T>
): Promise<{ data: T; source: string }> {
  const primary = getProvider();
  try {
    const data = await fn(primary);
    // Treat an empty array from a remote provider as "not ready yet".
    if (primary.name !== "seed" && Array.isArray(data) && data.length === 0) {
      return { data: await fn(seedProvider), source: "seed" };
    }
    return { data, source: primary.name };
  } catch {
    return { data: await fn(seedProvider), source: "seed" };
  }
}

export { seedProvider, footballDataProvider };
export type { DataProvider };
