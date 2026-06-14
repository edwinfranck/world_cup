"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { useSquad } from "@/lib/api";
import { CardListSkeleton } from "@/components/ui/states";
import type { Player } from "@/lib/types";

function groupByPosition(players: Player[]) {
  const buckets: Record<string, Player[]> = {
    Gardiens: [],
    Défenseurs: [],
    Milieux: [],
    Attaquants: [],
    Autres: [],
  };
  for (const p of players) {
    const pos = (p.position ?? "").toLowerCase();
    if (pos.includes("goal")) buckets["Gardiens"].push(p);
    else if (pos.includes("back") || pos.includes("defen"))
      buckets["Défenseurs"].push(p);
    else if (pos.includes("mid")) buckets["Milieux"].push(p);
    else if (pos.includes("forward") || pos.includes("wing") || pos.includes("strik"))
      buckets["Attaquants"].push(p);
    else buckets["Autres"].push(p);
  }
  return Object.entries(buckets).filter(([, list]) => list.length > 0);
}

export function SquadList({ code }: { code: string }) {
  const { data, isLoading } = useSquad(code);
  const players = data?.players ?? [];

  if (isLoading) return <CardListSkeleton count={4} />;

  if (!players.length) {
    return (
      <div className="rounded-none border border-dashed border-border bg-surface/50 p-4 text-center text-xs text-muted">
        Effectif indisponible pour cette sélection via la source gratuite.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupByPosition(players).map(([label, list]) => (
        <div key={label}>
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            {label}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-2.5 rounded-none border border-border bg-surface p-2.5 transition-colors hover:border-primary/50"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-none bg-surface-2">
        {player.thumb ? (
          <Image
            src={player.thumb}
            alt={player.name}
            width={44}
            height={44}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <User size={20} className="text-muted" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {player.name}
        </span>
        <span className="block truncate text-[11px] text-muted">
          {player.position ?? "—"}
        </span>
      </span>
    </Link>
  );
}
