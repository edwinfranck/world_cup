"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

export type Outcome = "HOME" | "DRAW" | "AWAY";

export interface Prediction {
  matchId: string;
  outcome: Outcome;
  homeScore: number;
  awayScore: number;
  createdAt: number;
}

interface AppState {
  favoriteTeams: string[]; // team codes
  favoriteMatches: string[]; // match ids
  predictions: Record<string, Prediction>;
  toggleTeam: (code: string) => void;
  toggleMatch: (id: string) => void;
  savePrediction: (p: Prediction) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      favoriteTeams: [],
      favoriteMatches: [],
      predictions: {},
      toggleTeam: (code) =>
        set((s) => ({
          favoriteTeams: s.favoriteTeams.includes(code)
            ? s.favoriteTeams.filter((c) => c !== code)
            : [...s.favoriteTeams, code],
        })),
      toggleMatch: (id) =>
        set((s) => ({
          favoriteMatches: s.favoriteMatches.includes(id)
            ? s.favoriteMatches.filter((m) => m !== id)
            : [...s.favoriteMatches, id],
        })),
      savePrediction: (p) =>
        set((s) => ({ predictions: { ...s.predictions, [p.matchId]: p } })),
      reset: () =>
        set({ favoriteTeams: [], favoriteMatches: [], predictions: {} }),
    }),
    { name: "mondial26-store" }
  )
);

/**
 * Guard against hydration mismatches: persisted state only exists on the client.
 * Components that render store data should gate on this.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
