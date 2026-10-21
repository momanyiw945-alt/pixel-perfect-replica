import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Hammer } from "lucide-react";

import { Footer } from "@/components/Footer";
import { ProgressBar } from "@/components/ProgressBar";
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
  component: QuizPlaceholder,
});

function QuizPlaceholder() {
  const quiz = useQuiz();
  const navigate = useNavigate();

  // No active session: back to the topics.
  useEffect(() => {
    if (quiz.hydrated && !quiz.session) {
      navigate({ to: "/", replace: true });
    }
  }, [quiz.hydrated, quiz.session, navigate]);

  if (!quiz.hydrated || !quiz.session) {
    return <div className="min-h-screen" />;
  }

  const total = quiz.session.questionIds.length;
  const position = Math.min(quiz.session.currentIndex + 1, total);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Hammer className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-foreground">Quiz screen coming next</h1>
        <p className="text-sm text-muted-foreground">
          Your session is saved — question {position} of {total} is waiting for the full quiz
          experience in the next update.
        </p>
        <ProgressBar current={position} total={total} />
        <Button
          variant="outline"
          className="mt-2 min-h-12"
          onClick={() => {
            quiz.quit();
            navigate({ to: "/" });
          }}
        >
          Quit to topics
        </Button>
      </main>
      <Footer />
    </div>
  );
}
