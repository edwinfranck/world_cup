import type { Match } from "@/lib/types";
import type { Prediction } from "@/lib/store";

/** Points for a single prediction: exact score = 5, correct outcome only = 2. */
export function predictionPoints(p: Prediction, match: Match): number | null {
  if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
    return null; // not settled yet
  }
  const exact = p.homeScore === match.homeScore && p.awayScore === match.awayScore;
  if (exact) return 5;
  const actual = Math.sign(match.homeScore - match.awayScore);
  const guessed = Math.sign(p.homeScore - p.awayScore);
  return actual === guessed ? 2 : 0;
}

export interface Score {
  points: number;
  settled: number; // predictions that have a result
  exact: number;
  correct: number;
  total: number; // total predictions made
}

export function scorePredictions(
  predictions: Record<string, Prediction>,
  matches: Match[]
): Score {
  const byId = new Map(matches.map((m) => [m.id, m]));
  let points = 0,
    settled = 0,
    exact = 0,
    correct = 0;
  const list = Object.values(predictions);
  for (const p of list) {
    const m = byId.get(p.matchId);
    if (!m) continue;
    const pts = predictionPoints(p, m);
    if (pts === null) continue;
    settled++;
    points += pts;
    if (pts === 5) exact++;
    else if (pts === 2) correct++;
  }
  return { points, settled, exact, correct, total: list.length };
}

export function xpFor(score: Score, favorites: number): number {
  return score.points * 10 + score.total * 5 + favorites * 8;
}

/** Level curve: each level needs progressively more XP. */
export function levelFor(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = Math.round(needed * 1.35);
  }
  return { level, into: remaining, needed };
}

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  earned: boolean;
}

export function computeBadges(args: {
  score: Score;
  favoriteTeams: number;
  favoriteMatches: number;
}): Badge[] {
  const { score, favoriteTeams, favoriteMatches } = args;
  return [
    { id: "first-pred", label: "Premier pronostic", emoji: "🎯", earned: score.total >= 1 },
    { id: "ten-preds", label: "10 pronostics", emoji: "📈", earned: score.total >= 10 },
    { id: "first-exact", label: "Score exact !", emoji: "🎰", earned: score.exact >= 1 },
    { id: "five-correct", label: "5 bons résultats", emoji: "🔥", earned: score.correct + score.exact >= 5 },
    { id: "fan", label: "Supporter", emoji: "❤️", earned: favoriteTeams >= 1 },
    { id: "super-fan", label: "Supporter fidèle", emoji: "💎", earned: favoriteTeams >= 3 },
    { id: "watchlist", label: "Liste de matchs", emoji: "⭐", earned: favoriteMatches >= 1 },
    { id: "centurion", label: "100 points", emoji: "🏆", earned: score.points >= 100 },
  ];
}
