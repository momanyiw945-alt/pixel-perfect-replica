import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [{ title: "Results — AZ-900 Smart Quiz (Unofficial)" }],
  }),
  component: ResultsPlaceholder,
});

function ResultsPlaceholder() {
  const quiz = useQuiz();
  const navigate = useNavigate();

  useEffect(() => {
    if (quiz.hydrated && !quiz.session) {
      navigate({ to: "/", replace: true });
    }
  }, [quiz.hydrated, quiz.session, navigate]);

  if (!quiz.hydrated || !quiz.session) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          You scored {quiz.score} of {quiz.session.questionIds.length}
        </h1>
        <Button
          className="min-h-12"
          onClick={() => {
            quiz.quit();
            navigate({ to: "/" });
          }}
        >
          Back to topics
        </Button>
      </main>
      <Footer />
    </div>
  );
}