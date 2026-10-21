import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChartPie } from "lucide-react";

import { Footer } from "@/components/Footer";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — AZ-900 Smart Quiz (Unofficial)" },
      {
        name: "description",
        content: "See how you did across each Azure Fundamentals topic.",
      },
      { property: "og:title", content: "Results — AZ-900 Smart Quiz (Unofficial)" },
      { property: "og:description", content: "See how you did across each topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPlaceholder,
});

function ResultsPlaceholder() {
  const quiz = useQuiz();
  const navigate = useNavigate();

  // Nothing to show (no session, nothing just finished): back to the topics.
  useEffect(() => {
    if (quiz.hydrated && !quiz.session && !quiz.finished) {
      navigate({ to: "/", replace: true });
    }
  }, [quiz.hydrated, quiz.session, quiz.finished, navigate]);

  if (!quiz.hydrated || (!quiz.session && !quiz.finished)) {
    return <div className="min-h-screen" />;
  }

  const total = quiz.session?.questionIds.length ?? 0;
  const answered = Object.keys(quiz.session?.answers ?? {}).length;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ChartPie className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-foreground">Results screen coming next</h1>
        <p className="text-sm text-muted-foreground">
          {answered > 0
            ? `You answered ${answered} of ${total} questions — a full breakdown per topic arrives in the next update.`
            : "A full breakdown per topic arrives in the next update."}
        </p>
        {total > 0 && <ProgressBar current={answered} total={total} label="Answered" />}
        <Button
          variant="outline"
          className="mt-2 min-h-12"
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
