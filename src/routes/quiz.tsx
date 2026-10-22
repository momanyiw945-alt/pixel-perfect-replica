import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { ExplanationPanel } from "@/components/ExplanationPanel";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Practice quiz — AZ-900 Smart Quiz (Unofficial)" },
      {
        name: "description",
        content: "Answer Azure Fundamentals practice questions and learn why each answer is right.",
      },
      { property: "og:title", content: "Practice quiz — AZ-900 Smart Quiz (Unofficial)" },
      {
        property: "og:description",
        content: "Answer practice questions and learn why each answer is right.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const quiz = useQuiz();
  const navigate = useNavigate();
  const nextRef = useRef<HTMLButtonElement>(null);

  const session = quiz.session;
  const question = quiz.currentQuestion;
  const answered = question ? Boolean(session?.answers[question.id]) : false;
  const isLast = session ? session.currentIndex === session.questionIds.length - 1 : false;

  // Routing guards, evaluated only after hydration so server and client match.
  useEffect(() => {
    if (!quiz.hydrated) return;
    if (quiz.finished) {
      navigate({ to: "/results", replace: true });
      return;
    }
    if (!quiz.session) {
      navigate({ to: "/", replace: true });
    }
  }, [quiz.hydrated, quiz.session, quiz.finished, navigate]);

  // Move focus to the Next button after answering.
  useEffect(() => {
    if (quiz.hydrated && answered) {
      nextRef.current?.focus();
    }
  }, [quiz.hydrated, answered, session?.currentIndex]);

  // Keys 1-4 select an option before answering.
  useEffect(() => {
    if (!quiz.hydrated || answered) return;
    const handler = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (!question || !session || Number.isNaN(index)) return;
      if (index < 0 || index > 3) return;
      const optionId = session.optionOrder[question.id]?.[index];
      if (optionId) quiz.answer(optionId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quiz.hydrated, answered, question, session, quiz]);

  if (!quiz.hydrated || !session || !question) {
    return <div className="min-h-screen" />;
  }

  const optionOrder = session.optionOrder[question.id] ?? question.options.map((o) => o.id);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32 pt-4">
        <QuestionCard
          question={question}
          position={session.currentIndex + 1}
          total={session.questionIds.length}
          optionOrder={optionOrder}
          chosenOptionId={session.answers[question.id] ?? null}
          currentStreak={quiz.currentStreak}
          onAnswer={quiz.answer}
          onQuit={() => {
            quiz.quit();
            navigate({ to: "/" });
          }}
        />

        {answered && (
          <div className="mt-4">
            <ExplanationPanel question={question} />
          </div>
        )}
      </main>

      {answered && (
        <div
          className="sticky bottom-0 border-t bg-background/95 px-4 py-3 backdrop-blur"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            ref={nextRef}
            className="h-12 w-full text-base font-semibold"
            onClick={quiz.next}
          >
            {isLast ? "See results" : "Next"}
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
}
