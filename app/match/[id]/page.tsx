"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { useMatch } from "@/lib/api";
import { TeamFlag } from "@/components/team-flag";
import { PredictionPanel } from "@/components/prediction-panel";
import { FavoriteMatchButton } from "@/components/favorite-button";
import { MatchTimeline } from "@/components/match-timeline";
import { Lineups } from "@/components/lineups";
import { Skeleton } from "@/components/ui/states";
import { formatDateLabel, formatKickoff } from "@/lib/utils";
import { STAGE_LABELS, type Match, type MatchStats } from "@/lib/types";

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useMatch(id);
  const match = data?.match;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <Link
          href="/fixtures"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
        <FavoriteMatchButton id={id} size={20} />
      </div>

      {isLoading || !match ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <>
          <Scoreboard match={match} />
          <MatchTimeline match={match} />
          <PredictionPanel match={match} />
          <Lineups match={match} />
          <StatsBlock stats={match.stats} />
        </>
      )}
    </div>
  );
}

function Scoreboard({ match }: { match: Match }) {
  const played =
    match.status === "FINISHED" ||
    match.status === "LIVE" ||
    match.status === "PAUSED";
  const statusText =
    match.status === "LIVE" || match.status === "PAUSED"
      ? match.minute
        ? `${match.minute}'`
        : "EN DIRECT"
      : match.status === "FINISHED"
        ? "Terminé"
        : `${formatDateLabel(match.utcDate)} · ${formatKickoff(match.utcDate)}`;

  return (
    <div className="rounded-none border border-border bg-surface p-5">
      <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-muted">
        {match.groupId
          ? `Groupe ${match.groupId}`
          : STAGE_LABELS[match.stage]}
      </div>
      <div className="grid grid-cols-3 items-center gap-2">
        <TeamSide team={match.home} />
        <div className="text-center">
          {played ? (
            <div className="text-3xl font-extrabold tabular-nums">
              {match.homeScore ?? 0}
              <span className="mx-1 text-muted">:</span>
              {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="text-lg font-bold text-muted">VS</div>
          )}
          <div
            className={
              match.status === "LIVE" || match.status === "PAUSED"
                ? "mt-1 text-xs font-bold text-live"
                : "mt-1 text-xs font-semibold text-muted"
            }
          >
            {statusText}
          </div>
        </div>
        <TeamSide team={match.away} />
      </div>
      {match.venue && (
        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted">
          <MapPin size={12} /> {match.venue}
        </div>
      )}
    </div>
  );
}

function TeamSide({ team }: { team: Match["home"] }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <TeamFlag team={team} size="lg" />
      <span className="text-sm font-semibold leading-tight">{team.name}</span>
    </div>
  );
}

const STAT_ROWS: { key: keyof MatchStats; label: string; pair: [keyof MatchStats, keyof MatchStats] }[] =
  [
    { key: "possessionHome", label: "Possession (%)", pair: ["possessionHome", "possessionAway"] },
    { key: "shotsHome", label: "Tirs", pair: ["shotsHome", "shotsAway"] },
    { key: "shotsOnTargetHome", label: "Tirs cadrés", pair: ["shotsOnTargetHome", "shotsOnTargetAway"] },
    { key: "cornersHome", label: "Corners", pair: ["cornersHome", "cornersAway"] },
    { key: "foulsHome", label: "Fautes", pair: ["foulsHome", "foulsAway"] },
  ];

function StatsBlock({ stats }: { stats?: MatchStats }) {
  if (!stats) {
    return (
      <div className="rounded-none border border-dashed border-border bg-surface/50 p-4 text-center text-sm text-muted">
        Statistiques détaillées indisponibles pour ce match.
        <br />
        <span className="text-xs">
          (Disponibles via un fournisseur de données connecté.)
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-none border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
        Statistiques
      </h2>
      <div className="space-y-3">
        {STAT_ROWS.map((row) => {
          const h = Number(stats[row.pair[0]] ?? 0);
          const a = Number(stats[row.pair[1]] ?? 0);
          const total = h + a || 1;
          return (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span>{h}</span>
                <span className="text-muted">{row.label}</span>
                <span>{a}</span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-none bg-surface-2">
                <div
                  className="bg-primary"
                  style={{ width: `${(h / total) * 100}%` }}
                />
                <div
                  className="bg-accent"
                  style={{ width: `${(a / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
