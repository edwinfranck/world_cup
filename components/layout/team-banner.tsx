"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTeams } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { getTeamColors, readableOn } from "@/lib/team-colors";
import { TeamFlag } from "@/components/team-flag";

/**
 * Branded header strip shown when the user has a primary favourite team:
 * the flag + name on a gradient built from the nation's flag colours.
 */
export function TeamBanner() {
  const hydrated = useHydrated();
  const code = useAppStore((s) => s.favoriteTeams[0]);
  const { data } = useTeams();

  if (!hydrated || !code) return null;
  const team = data?.teams.find((t) => t.id === code);
  const colors = getTeamColors(code);
  if (!team || !colors) return null;

  const fg = readableOn(colors.primary);

  return (
    <Link
      href={`/teams/${team.id}`}
      className="block border-b border-border"
      style={{
        background: `linear-gradient(100deg, ${colors.primary} 0%, ${colors.primary} 45%, ${colors.secondary} 130%)`,
        color: fg,
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-3 py-2 sm:px-4">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center border"
          style={{ borderColor: fg === "#ffffff" ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.25)" }}
        >
          <TeamFlag team={team} size="md" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
            Votre équipe
          </div>
          <div className="truncate text-sm font-extrabold">{team.name}</div>
        </div>
        <ChevronRight size={18} className="opacity-80" />
      </div>
    </Link>
  );
}
