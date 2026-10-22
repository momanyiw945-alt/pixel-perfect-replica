import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getDomains, getQuestions, getQuestionsByDomain } from "@/lib/examData";
import {
  clearSession,
  getStats,
  loadSession,
  recordAnswer,
  saveSession,
  type QuizSession,
} from "@/lib/storage";
import type { Question } from "@/types/quiz";

// ---- Helpers ----

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function buildOptionOrder(ordered: Question[]): Record<string, string[]> {
  const order: Record<string, string[]> = {};
  for (const q of ordered) {
    order[q.id] = shuffle(q.options.map((o) => o.id));
  }
  return order;
}

// "mixed": sample across domains in proportion to each domain's weight
// midpoint using largest-remainder allocation, capped by availability, with
// any shortfall filled from domains that still have questions.
export function allocateMixed(count: number): Question[] {
  const domains = getDomains();
  const pools = new Map(domains.map((d) => [d.id, getQuestionsByDomain(d.id)] as const));
  const midpoints = domains.map((d) => (d.weightMin + d.weightMax) / 2);
  const totalWeight = midpoints.reduce((sum, w) => sum + w, 0);
  if (domains.length === 0 || totalWeight <= 0) return shuffle(getQuestions());

  const exact = midpoints.map((w) => (count * w) / totalWeight);
  const alloc = exact.map((w) => Math.floor(w));
  let leftover = count - alloc.reduce((sum, n) => sum + n, 0);
  const byLargestFraction = domains
    .map((_, i) => i)
    .sort(
      (a, b) =>
        (exact[b]! - Math.floor(exact[b]!)) - (exact[a]! - Math.floor(exact[a]!)) || a - b
    );
  for (let k = 0; k < leftover; k++) {
    const i = byLargestFraction[k % byLargestFraction.length]!;
    alloc[i] = (alloc[i] ?? 0) + 1;
  }

  for (let i = 0; i < domains.length; i++) {
    const pool = pools.get(domains[i]!.id)!;
    alloc[i] = Math.min(alloc[i] ?? 0, pool.length);
  }
  let shortfall = count - alloc.reduce((sum, n) => sum + n, 0);
  while (shortfall > 0) {
    let progressed = false;
    for (let i = 0; i < domains.length && shortfall > 0; i++) {
      const pool = pools.get(domains[i]!.id)!;
      if ((alloc[i] ?? 0) < pool.length) {
        alloc[i] = (alloc[i] ?? 0) + 1;
        shortfall--;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  const picked: Question[] = [];
  domains.forEach((d, i) => {
    const pool = pools.get(d.id)!;
    picked.push(...shuffle(pool).slice(0, alloc[i] ?? 0));
  });
  return shuffle(picked);
}

function buildWeakQuestions(): Question[] {
  const stats = getStats();
  return shuffle(getQuestions().filter((q) => stats[q.id]?.lastCorrect === false));
}

const ALL_QUESTIONS = getQuestions();
const QUESTIONS_BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q] as const));

function restoreSession(): QuizSession | null {
  const stored = loadSession();
  if (!stored) return null;
  // Discard a stored session if any of its question ids no longer exist.
  if (!stored.questionIds.every((id) => QUESTIONS_BY_ID.has(id))) {
    clearSession();
    return null;
  }
  const optionOrder: Record<string, string[]> = {};
  for (const id of stored.questionIds) {
    const question = QUESTIONS_BY_ID.get(id)!;
    const optionIds = question.options.map((o) => o.id);
    const storedOrder = stored.optionOrder[id];
    const valid =
      Array.isArray(storedOrder) &&
      storedOrder.length === optionIds.length &&
      storedOrder.every((v) => optionIds.includes(v));
    optionOrder[id] = valid ? (storedOrder as string[]) : optionIds;
  }
  return { ...stored, optionOrder };
}

// ---- Context ----

export interface DomainResult {
  attempted: number;
  correct: number;
}

interface QuizContextValue {
  hydrated: boolean;
  session: QuizSession | null;
  finished: boolean;
  questions: Question[];
  currentQuestion: Question | null;
  score: number;
  perDomain: Record<string, DomainResult>;
  currentStreak: number;
  longestStreak: number;
  weakCount: number;
  startSession: (mode: string, count: number | "all") => void;
  answer: (optionId: string) => void;
  next: () => void;
  quit: () => void;
  resume: () => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(() => restoreSession());
  const [finished, setFinished] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const startSession = useCallback((mode: string, count: number | "all") => {
    let pool: Question[];
    if (mode === "mixed") {
      const size = count === "all" ? ALL_QUESTIONS.length : count;
      pool = allocateMixed(size);
    } else if (mode === "weak") {
      pool = buildWeakQuestions();
    } else {
      const domainQuestions = getQuestionsByDomain(mode);
      pool = shuffle(count === "all" ? domainQuestions : domainQuestions.slice(0, count));
    }
    if (pool.length === 0) return;
    const ordered = shuffle(pool);
    const fresh: QuizSession = {
      mode,
      requestedCount: count,
      questionIds: ordered.map((q) => q.id),
      optionOrder: buildOptionOrder(ordered),
      currentIndex: 0,
      answers: {},
      createdAt: Date.now(),
    };
    setSession(fresh);
    setFinished(false);
    saveSession(fresh);
  }, []);

  const answer = useCallback(
    (optionId: string) => {
      if (!session) return;
      const index = session.questionIds[session.currentIndex];
      const question = index ? QUESTIONS_BY_ID.get(index) : undefined;
      if (!question || session.answers[question.id]) return;
      const correct = optionId === question.correctOptionId;
      recordAnswer(question.id, correct);
      const updated: QuizSession = {
        ...session,
        answers: { ...session.answers, [question.id]: optionId },
      };
      setSession(updated);
      saveSession(updated);
    },
    [session]
  );

  const next = useCallback(() => {
    if (!session) return;
    if (session.currentIndex + 1 < session.questionIds.length) {
      const updated: QuizSession = { ...session, currentIndex: session.currentIndex + 1 };
      setSession(updated);
      saveSession(updated);
      return;
    }
    // Session complete: keep it in memory for the results screen but clear storage.
    clearSession();
    setFinished(true);
  }, [session]);

  const quit = useCallback(() => {
    clearSession();
    setSession(null);
    setFinished(false);
  }, []);

  const resume = useCallback(() => {
    const stored = restoreSession();
    if (stored) {
      setSession(stored);
      setFinished(false);
    }
  }, []);

  const derived = useMemo(() => {
    const questions: Question[] = [];
    if (session) {
      for (const id of session.questionIds) {
        const q = QUESTIONS_BY_ID.get(id);
        if (q) questions.push(q);
      }
    }
    const currentQuestion = session ? (questions[session.currentIndex] ?? null) : null;

    let score = 0;
    const perDomain: Record<string, DomainResult> = {};
    let run = 0;
    let longestStreak = 0;
    for (const q of questions) {
      const chosen = session?.answers[q.id];
      if (!chosen) continue;
      const correct = chosen === q.correctOptionId;
      if (correct) {
        score++;
        run++;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
      const entry = perDomain[q.domainId] ?? { attempted: 0, correct: 0 };
      entry.attempted++;
      if (correct) entry.correct++;
      perDomain[q.domainId] = entry;
    }

    const stats = getStats();
    const weakCount = ALL_QUESTIONS.filter((q) => stats[q.id]?.lastCorrect === false).length;

    return { questions, currentQuestion, score, perDomain, currentStreak: run, longestStreak, weakCount };
  }, [session, finished]);

  const value = useMemo<QuizContextValue>(
    () => ({
      hydrated,
      session,
      finished,
      ...derived,
      startSession,
      answer,
      next,
      quit,
      resume,
    }),
    [hydrated, session, finished, derived, startSession, answer, next, quit, resume]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used inside a QuizProvider");
  return ctx;
}
