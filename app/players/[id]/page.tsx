"use client";

import { use } from "react";
import Image from "next/image";
import { ArrowLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/lib/api";
import { Skeleton, EmptyState } from "@/components/ui/states";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = usePlayer(id);
  const p = data?.player;

  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (!p) return <EmptyState message="Joueur introuvable." />;

  const age = p.birthDate ? ageFrom(p.birthDate) : undefined;

  return (
    <div className="space-y-4 animate-fade-up">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="rounded-none border border-border bg-surface p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-none bg-surface-2">
            {p.thumb ? (
              <Image
                src={p.thumb}
                alt={p.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <User size={32} className="text-muted" />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight">{p.name}</h1>
            <p className="text-sm text-muted">
              {[p.position, p.nationality].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {p.number && <Info label="Numéro" value={`#${p.number}`} />}
          {age !== undefined && <Info label="Âge" value={`${age}`} />}
          {p.club && <Info label="Club" value={p.club} />}
        </div>
      </div>

      {p.description && (
        <div className="rounded-none border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
            Biographie
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-[12]">
            {p.description}
          </p>
        </div>
      )}

      <p className="rounded-none border border-dashed border-border bg-surface/50 p-3 text-center text-[11px] text-muted">
        Données joueurs : TheSportsDB (source gratuite).
      </p>
    </div>
  );
}

function ageFrom(birth: string): number | undefined {
  const d = new Date(birth);
  if (isNaN(d.getTime())) return undefined;
  const now = new Date("2026-06-11");
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none bg-surface-2 px-2 py-2">
      <div className="truncate text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
