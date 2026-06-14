"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useMatches, useStadiums, useTeams } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { formatDateLabel } from "@/lib/utils";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const { data: teamsData } = useTeams();
  const { data: matchesData } = useMatches();
  const { data: stadiumsData } = useStadiums();

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (query.length < 2)
      return { teams: [], matches: [], stadiums: [] };
    const teams = (teamsData?.teams ?? []).filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query)
    );
    const matches = (matchesData?.matches ?? [])
      .filter(
        (m) =>
          m.home.name.toLowerCase().includes(query) ||
          m.away.name.toLowerCase().includes(query)
      )
      .slice(0, 12);
    const stadiums = (stadiumsData?.stadiums ?? []).filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.city.toLowerCase().includes(query)
    );
    return { teams, matches, stadiums };
  }, [query, teamsData, matchesData, stadiumsData]);

  const empty =
    query.length >= 2 &&
    !results.teams.length &&
    !results.matches.length &&
    !results.stadiums.length;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="relative">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Équipes, matchs, stades…"
          className="w-full rounded-none border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {query.length < 2 && (
        <p className="text-sm text-muted">
          Tapez au moins 2 caractères pour rechercher.
        </p>
      )}

      {empty && <p className="text-sm text-muted">Aucun résultat.</p>}

      {results.teams.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase text-muted">Équipes</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.teams.map((t) => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="flex items-center gap-2.5 rounded-none border border-border bg-surface px-3 py-2.5"
              >
                <TeamFlag team={t} size="md" />
                <span className="text-sm font-semibold">{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.matches.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase text-muted">Matchs</h2>
          <div className="space-y-2">
            {results.matches.map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="flex items-center gap-2 rounded-none border border-border bg-surface px-3 py-2.5 text-sm"
              >
                <TeamFlag team={m.home} size="sm" />
                <span className="font-medium">{m.home.code}</span>
                <span className="text-muted">vs</span>
                <span className="font-medium">{m.away.code}</span>
                <TeamFlag team={m.away} size="sm" />
                <span className="ml-auto text-xs text-muted">
                  {formatDateLabel(m.utcDate)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.stadiums.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase text-muted">Stades</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.stadiums.map((s) => (
              <div
                key={s.id}
                className="rounded-none border border-border bg-surface px-3 py-2.5"
              >
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-muted">
                  {s.city}, {s.country}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
