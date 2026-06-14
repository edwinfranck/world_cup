"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

export type Outcome = "HOME" | "DRAW" | "AWAY";
export type Locale = "fr" | "en" | "es";

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
  bracketPicks: Record<string, "home" | "away">;
  motmVotes: Record<string, string>; // matchId -> player name
  fantasy: string[]; // "CODE|Player Name" identifiers
  quizBest: number;
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleTeam: (code: string) => void;
  toggleMatch: (id: string) => void;
  savePrediction: (p: Prediction) => void;
  setBracketPick: (matchId: string, side: "home" | "away") => void;
  setBracketPicks: (picks: Record<string, "home" | "away">) => void;
  resetBracket: () => void;
  voteMotm: (matchId: string, player: string) => void;
  setFantasy: (ids: string[]) => void;
  setQuizBest: (n: number) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      favoriteTeams: [],
      favoriteMatches: [],
      predictions: {},
      bracketPicks: {},
      motmVotes: {},
      fantasy: [],
      quizBest: 0,
      locale: "fr",
      setLocale: (l) => set({ locale: l }),
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
      setBracketPick: (matchId, side) =>
        set((s) => ({ bracketPicks: { ...s.bracketPicks, [matchId]: side } })),
      setBracketPicks: (picks) => set({ bracketPicks: picks }),
      resetBracket: () => set({ bracketPicks: {} }),
      voteMotm: (matchId, player) =>
        set((s) => ({ motmVotes: { ...s.motmVotes, [matchId]: player } })),
      setFantasy: (ids) => set({ fantasy: ids }),
      setQuizBest: (n) =>
        set((s) => ({ quizBest: Math.max(s.quizBest, n) })),
      reset: () =>
        set({
          favoriteTeams: [],
          favoriteMatches: [],
          predictions: {},
          bracketPicks: {},
          motmVotes: {},
          fantasy: [],
          quizBest: 0,
        }),
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
