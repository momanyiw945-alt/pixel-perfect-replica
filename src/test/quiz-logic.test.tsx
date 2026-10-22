import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { QuizProvider, useQuiz } from "@/hooks/useQuiz";
import {
  anyLocalText,
  formatWeight,
  getExam,
  getQuestions,
  getQuestionsByDomain,
  hasLocalText,
} from "@/lib/examData";
import {
  clearSession,
  getPrefs,
  getStats,
  loadSession,
  recordAnswer,
  saveSession,
  setPrefs,
} from "@/lib/storage";
import { routeTree } from "@/routeTree.gen";

const QUESTION_COUNT = 3;

describe("exam data", () => {
  it("exposes the AZ-900 config with weighted domains", () => {
    expect(getExam().id).toBe("az-900");
    expect(getExam().passTarget).toBe(70);
    expect(formatWeight(getExam().domains[0]!)).toBe("25-30%");
    expect(getQuestions()).toHaveLength(QUESTION_COUNT);
    expect(getQuestionsByDomain("cloud-concepts")).toHaveLength(1);
  });

  it("keeps Kiswahili plain-English text on 2 of 3 questions", () => {
    expect(getExam().languages.some((l) => l.code === "sw")).toBe(true);
    expect(getQuestions().filter(hasLocalText)).toHaveLength(2);
    expect(anyLocalText()).toBe(true);
  });
});

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records per-question answer stats", () => {
    recordAnswer("q-cloud-001", true);
    recordAnswer("q-cloud-001", false);
    expect(getStats()["q-cloud-001"]).toMatchObject({
      attempts: 2,
      correct: 1,
      lastCorrect: false,
    });
  });

  it("discards malformed stored JSON instead of throwing", () => {
    localStorage.setItem("quiz:stats:v1", "{not json");
    expect(getStats()).toEqual({});
    localStorage.setItem("quiz:prefs:v1", "oops");
    expect(getPrefs().language).toBeNull();
  });

  it("saves, loads and clears sessions; persists language prefs", () => {
    saveSession({
      mode: "mixed",
      requestedCount: 10,
      questionIds: ["q-cloud-001", "q-arch-001"],
      optionOrder: {},
      currentIndex: 0,
      answers: {},
      createdAt: 1,
    });
    expect(loadSession()?.questionIds).toEqual(["q-cloud-001", "q-arch-001"]);
    clearSession();
    expect(loadSession()).toBeNull();

    setPrefs({ language: "sw" });
    expect(getPrefs().language).toBe("sw");
  });
});

describe("useQuiz", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const setup = () => renderHook(() => useQuiz(), { wrapper: QuizProvider });

  it("starts a mixed session covering every domain", () => {
    const { result } = setup();
    act(() => result.current.startSession("mixed", "all"));
    expect(result.current.session?.questionIds).toHaveLength(QUESTION_COUNT);
    expect(new Set(result.current.session?.questionIds).size).toBe(QUESTION_COUNT);
  });

  it("answers, scores, streaks and finishes; storage cleared on finish", () => {
    const { result } = setup();
    act(() => result.current.startSession("mixed", "all"));
    for (let i = 0; i < QUESTION_COUNT; i++) {
      const question = result.current.currentQuestion!;
      act(() => result.current.answer(question.correctOptionId));
      if (i < QUESTION_COUNT - 1) act(() => result.current.next());
    }
    expect(result.current.score).toBe(QUESTION_COUNT);
    expect(result.current.longestStreak).toBe(QUESTION_COUNT);
    expect(result.current.finished).toBe(true);
    expect(loadSession()).toBeNull();
  });

  it("counts a weak question after a wrong answer", () => {
    const { result } = setup();
    act(() => result.current.startSession("mixed", "all"));
    const question = result.current.currentQuestion!;
    const wrong = question.options.find((o) => o.id !== question.correctOptionId)!;
    act(() => result.current.answer(wrong.id));
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.weakCount).toBe(1);
  });

  it("restores a saved session synchronously", () => {
    const ids = getQuestions().map((q) => q.id);
    saveSession({
      mode: "mixed",
      requestedCount: "all",
      questionIds: ids,
      optionOrder: {},
      currentIndex: 1,
      answers: { [ids[0]!]: "a" },
      createdAt: 1,
    });
    const { result } = setup();
    expect(result.current.session?.currentIndex).toBe(1);
    expect(result.current.session?.questionIds).toEqual(ids);
  });

  it("discards a saved session whose questions no longer exist", () => {
    saveSession({
      mode: "mixed",
      requestedCount: "all",
      questionIds: ["gone-1", "gone-2"],
      optionOrder: {},
      currentIndex: 0,
      answers: {},
      createdAt: 1,
    });
    const { result } = setup();
    expect(result.current.session).toBeNull();
    expect(loadSession()).toBeNull();
  });
});

describe("routes", () => {
  it("matches /quiz and /results to page routes", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const path of ["/quiz", "/results"]) {
      expect(router.matchRoutes(path).at(-1)?.routeId).not.toBe(rootRouteId);
    }
  });
});
