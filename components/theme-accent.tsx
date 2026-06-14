"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getTeamColors, readableOn } from "@/lib/team-colors";

/**
 * Re-theme the whole app around the user's primary favourite (first favourite).
 * Overrides the --primary / --accent CSS variables on <html> via inline style,
 * which wins over both the :root and .dark stylesheet rules — so the team accent
 * holds in light AND dark mode. Cleared when there's no favourite.
 */
export function ThemeAccent() {
  const primaryFav = useAppStore((s) => s.favoriteTeams[0]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = getTeamColors(primaryFav);
    if (!colors) {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--accent");
      return;
    }
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", readableOn(colors.primary));
    root.style.setProperty("--accent", colors.secondary);
  }, [primaryFav]);

  return null;
}
