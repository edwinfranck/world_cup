"use client";

import { useState } from "react";
import { Check, RotateCcw, Trophy, X } from "lucide-react";
import { useGroups, useMatches, useStadiums, useTeams } from "@/lib/api";
import { useAppStore, useHydrated } from "@/lib/store";
import { CardListSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import type { Group, Match } from "@/lib/types";
import type { Stadium } from "@/lib/data/worldcup-2026";

interface Question {
  q: string;
  options: string[];
  answer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function buildQuiz(
  teams: { name: string; groupId?: string }[],
  groups: Group[],
  stadiums: Stadium[],
  matches: Match[]
): Question[] {
  const qs: Question[] = [];
  const names = teams.map((t) => t.name);

  // 1) Which group is team X in?
  for (const t of pick(teams.filter((x) => x.groupId), 3)) {
    const wrong = pick(
      "ABCDEFGHIJKL".split("").filter((g) => g !== t.groupId),
      3
    );
    qs.push({
      q: `Dans quel groupe joue ${t.name} ?`,
      options: shuffle([t.groupId!, ...wrong]).map((g) => `Groupe ${g}`),
      answer: `Groupe ${t.groupId}`,
    });
  }

  // 2) Stadium city
  for (const s of pick(stadiums, 2)) {
    qs.push({
      q: `Dans quelle ville se trouve « ${s.name} » ?`,
      options: shuffle([
        s.city,
        ...pick(stadiums.filter((x) => x.city !== s.city), 3).map((x) => x.city),
      ]),
      answer: s.city,
    });
  }

  // 3) Biggest capacity
  const sorted = [...stadiums].sort((a, b) => b.capacity - a.capacity);
  if (sorted.length >= 4) {
    qs.push({
      q: "Quel stade a la plus grande capacité ?",
      options: shuffle([sorted[0], ...pick(sorted.slice(1), 3)]).map((s) => s.name),
      answer: sorted[0].name,
    });
  }

  // 4) Who won a finished match?
  for (const m of pick(
    matches.filter(
      (x) =>
        x.status === "FINISHED" &&
        x.homeScore !== null &&
        x.homeScore !== x.awayScore
    ),
    3
  )) {
    const winner =
      (m.homeScore ?? 0) > (m.awayScore ?? 0) ? m.home.name : m.away.name;
    const others = pick(names.filter((n) => n !== winner), 3);
    qs.push({
      q: `Qui a gagné ${m.home.name} - ${m.away.name} (${m.homeScore}-${m.awayScore}) ?`,
      options: shuffle([winner, ...others]),
      answer: winner,
    });
  }

  // 5) Which team is in group X?
  for (const g of pick(groups, 2)) {
    const inGroup = g.standings[0]?.team.name;
    if (!inGroup) continue;
    const outNames = teams.filter((t) => t.groupId !== g.id).map((t) => t.name);
    qs.push({
      q: `Quelle équipe joue dans le groupe ${g.id} ?`,
      options: shuffle([inGroup, ...pick(outNames, 3)]),
      answer: inGroup,
    });
  }

  return shuffle(qs).slice(0, 8);
}

export default function QuizPage() {
  const hydrated = useHydrated();
  const { data: teamsData, isLoading: tl } = useTeams();
  const { data: groupsData } = useGroups();
  const { data: stadiumsData } = useStadiums();
  const { data: matchesData } = useMatches();
  const best = useAppStore((s) => s.quizBest);
  const setBest = useAppStore((s) => s.setQuizBest);

  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  function start() {
    const q = buildQuiz(
      teamsData?.teams ?? [],
      groupsData?.groups ?? [],
      stadiumsData?.stadiums ?? [],
      matchesData?.matches ?? []
    );
    setQuiz(q);
    setIdx(0);
    setScore(0);
    setChosen(null);
  }

  function answer(opt: string) {
    if (chosen || !quiz) return;
    setChosen(opt);
    if (opt === quiz[idx].answer) setScore((s) => s + 1);
  }

  function next() {
    if (!quiz) return;
    if (idx + 1 >= quiz.length) {
      setBest(score);
      setIdx(quiz.length); // results
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  if (tl) return <CardListSkeleton count={4} />;

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Quiz Coupe du Monde</h1>
        <p className="text-sm text-muted">
          8 questions générées depuis les vraies données.
          {hydrated && best > 0 && ` Meilleur score : ${best}/8.`}
        </p>
      </header>

      {!quiz && (
        <button
          onClick={start}
          className="w-full border border-primary bg-primary py-3 text-sm font-bold text-primary-foreground"
        >
          Commencer le quiz
        </button>
      )}

      {quiz && idx < quiz.length && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>
              Question {idx + 1}/{quiz.length}
            </span>
            <span>Score : {score}</span>
          </div>
          <div className="border border-border bg-surface p-4">
            <p className="mb-3 text-sm font-bold">{quiz[idx].q}</p>
            <div className="space-y-2">
              {quiz[idx].options.map((opt) => {
                const isAnswer = opt === quiz[idx].answer;
                const isChosen = opt === chosen;
                return (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    disabled={!!chosen}
                    className={cn(
                      "flex w-full items-center justify-between border px-3 py-2 text-left text-sm transition-colors",
                      !chosen && "border-border bg-surface hover:border-primary",
                      chosen && isAnswer && "border-primary bg-primary/15 font-bold",
                      chosen && isChosen && !isAnswer && "border-live bg-live/15",
                      chosen && !isChosen && !isAnswer && "border-border opacity-60"
                    )}
                  >
                    {opt}
                    {chosen && isAnswer && <Check size={16} className="text-primary" />}
                    {chosen && isChosen && !isAnswer && <X size={16} className="text-live" />}
                  </button>
                );
              })}
            </div>
          </div>
          {chosen && (
            <button
              onClick={next}
              className="w-full border border-primary bg-primary py-2.5 text-sm font-bold text-primary-foreground"
            >
              {idx + 1 >= quiz.length ? "Voir le résultat" : "Question suivante"}
            </button>
          )}
        </div>
      )}

      {quiz && idx >= quiz.length && (
        <div className="space-y-3 text-center">
          <div className="border border-gold bg-gold/10 p-6">
            <Trophy className="mx-auto mb-2 text-gold" size={32} />
            <div className="text-3xl font-extrabold">
              {score}/{quiz.length}
            </div>
            <p className="text-sm text-muted">
              {score === quiz.length
                ? "Parfait ! 🏆"
                : score >= quiz.length / 2
                  ? "Bien joué !"
                  : "Réessaie pour progresser."}
            </p>
          </div>
          <button
            onClick={start}
            className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:border-primary hover:text-primary"
          >
            <RotateCcw size={16} /> Rejouer
          </button>
        </div>
      )}
    </div>
  );
}
