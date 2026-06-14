import { NextResponse } from "next/server";

/**
 * Current weather per stadium via Open-Meteo — a genuinely FREE, keyless API.
 * Coordinates for the 16 host venues are hardcoded (stable reference data).
 */

export const revalidate = 1800; // 30 min

const COORDS: Record<string, [number, number]> = {
  "1": [19.3, -99.15], // Mexico City
  "2": [20.68, -103.46], // Guadalajara
  "3": [25.67, -100.24], // Monterrey
  "4": [32.75, -97.09], // Dallas
  "5": [29.68, -95.41], // Houston
  "6": [39.05, -94.48], // Kansas City
  "7": [33.75, -84.4], // Atlanta
  "8": [25.96, -80.24], // Miami
  "9": [42.09, -71.26], // Boston
  "10": [39.9, -75.17], // Philadelphia
  "11": [40.81, -74.07], // New York/New Jersey
  "12": [43.63, -79.42], // Toronto
  "13": [49.28, -123.11], // Vancouver
  "14": [47.59, -122.33], // Seattle
  "15": [37.4, -121.97], // San Francisco Bay
  "16": [33.95, -118.34], // Los Angeles
};

interface OmCurrent {
  current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
}

export async function GET() {
  const ids = Object.keys(COORDS);
  const lats = ids.map((id) => COORDS[id][0]).join(",");
  const lons = ids.map((id) => COORDS[id][1]).join(",");
  const weather: Record<string, { temp: number; code: number; wind: number } | null> =
    Object.fromEntries(ids.map((id) => [id, null]));

  try {
    // Single batched Open-Meteo call (multi-coordinate) → array, one per id.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (res.ok) {
      const json = (await res.json()) as OmCurrent[] | OmCurrent;
      const arr = Array.isArray(json) ? json : [json];
      arr.forEach((d, i) => {
        const id = ids[i];
        if (id && d.current) {
          weather[id] = {
            temp: Math.round(d.current.temperature_2m ?? 0),
            code: d.current.weather_code ?? 0,
            wind: Math.round(d.current.wind_speed_10m ?? 0),
          };
        }
      });
    }
  } catch {
    // leave nulls — UI just omits weather
  }

  return NextResponse.json(
    { weather },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}
