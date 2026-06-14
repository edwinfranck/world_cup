"use client";

import { Heart } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";

export function FavoriteTeamButton({
  code,
  size = 18,
  className,
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const hydrated = useHydrated();
  const fav = useAppStore((s) => s.favoriteTeams.includes(code));
  const toggle = useAppStore((s) => s.toggleTeam);
  const active = hydrated && fav;
  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(code);
      }}
      className={cn(
        "grid place-items-center rounded-none p-1.5 transition-colors",
        active ? "text-live" : "text-muted hover:text-live",
        className
      )}
    >
      <Heart size={size} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

export function FavoriteMatchButton({
  id,
  size = 18,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const hydrated = useHydrated();
  const fav = useAppStore((s) => s.favoriteMatches.includes(id));
  const toggle = useAppStore((s) => s.toggleMatch);
  const active = hydrated && fav;
  return (
    <button
      type="button"
      aria-label={active ? "Retirer le match" : "Suivre le match"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={cn(
        "grid place-items-center rounded-none p-1.5 transition-colors",
        active ? "text-gold" : "text-muted hover:text-gold",
        className
      )}
    >
      <Heart size={size} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
