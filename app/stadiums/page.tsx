"use client";

import { useMemo } from "react";
import { MapPin, Users, Wind } from "lucide-react";
import { useStadiums, useWeather } from "@/lib/api";
import { weatherInfo } from "@/lib/weather";
import { CardListSkeleton } from "@/components/ui/states";

const COUNTRY_FLAG: Record<string, string> = {
  "United States": "🇺🇸",
  Mexico: "🇲🇽",
  Canada: "🇨🇦",
};

export default function StadiumsPage() {
  const { data, isLoading } = useStadiums();
  const { data: weatherData } = useWeather();
  const weather = weatherData?.weather ?? {};

  const byCountry = useMemo(() => {
    const stadiums = data?.stadiums ?? [];
    const map = new Map<string, typeof stadiums>();
    for (const s of stadiums) {
      if (!map.has(s.country)) map.set(s.country, []);
      map.get(s.country)!.push(s);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Stades</h1>
        <p className="text-sm text-muted">
          16 enceintes · 3 pays hôtes · États-Unis, Mexique & Canada.
        </p>
      </header>

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : (
        <div className="space-y-5">
          {byCountry.map(([country, stadiums]) => (
            <section key={country}>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted">
                <span>{COUNTRY_FLAG[country] ?? "🏟️"}</span> {country}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {stadiums.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-none border border-border bg-surface p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-bold">{s.name}</div>
                      {weather[s.id] && (
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold">
                            {weatherInfo(weather[s.id]!.code).emoji}{" "}
                            {weather[s.id]!.temp}°
                          </div>
                          <div className="flex items-center justify-end gap-0.5 text-[10px] text-muted">
                            <Wind size={9} /> {weather[s.id]!.wind} km/h
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} /> {s.city}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Users size={12} /> {s.capacity.toLocaleString("fr-FR")}{" "}
                      places · {s.region}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
