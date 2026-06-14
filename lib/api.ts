"use client";

import { useQuery } from "@tanstack/react-query";
import type { Group, Match, Player, Team } from "@/lib/types";
import type { Stadium } from "@/lib/data/worldcup-2026";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
  return res.json() as Promise<T>;
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => get<{ matches: Match[]; source: string }>("/api/matches"),
    refetchInterval: 30_000, // live refresh
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: () =>
      get<{ match: Match; source: string }>(`/api/matches/${id}`),
    refetchInterval: 30_000,
    enabled: !!id,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => get<{ groups: Group[]; source: string }>("/api/groups"),
    refetchInterval: 60_000,
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => get<{ teams: Team[]; source: string }>("/api/teams"),
  });
}

export function useSquad(code: string) {
  return useQuery({
    queryKey: ["squad", code],
    queryFn: () =>
      get<{ players: Player[]; source: string }>(`/api/teams/${code}/squad`),
    enabled: !!code,
    staleTime: 60 * 60 * 1000, // 1h client cache; route caches 1 day
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["player", id],
    queryFn: () => get<{ player: Player }>(`/api/players/${id}`),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  });
}

export function useStadiums() {
  return useQuery({
    queryKey: ["stadiums"],
    queryFn: () => get<{ stadiums: Stadium[] }>("/api/stadiums"),
    staleTime: Infinity,
  });
}
