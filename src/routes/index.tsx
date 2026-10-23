import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Dumbbell, Play, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { Footer } from "@/components/Footer";
import { ProgressBar } from "@/components/ProgressBar";
import { TopicCard } from "@/components/TopicCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuiz } from "@/hooks/useQuiz";
import { getDomains, getExam, getQuestions, getQuestionsByDomain } from "@/lib/examData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AZ-900 Smart Quiz (Unofficial)" },
      {
        name: "description",
        content:
          "Unofficial Azure Fundamentals practice quiz. Pick a topic, answer questions and learn why — everything stays on your device.",
      },
      { property: "og:title", content: "AZ-900 Smart Quiz (Unofficial)" },
      {
        property: "og:description",
        content:
          "Pick a topic, answer, learn why. An unofficial, exam-agnostic study tool for beginner cloud learners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const quiz = useQuiz();
  const navigate = useNavigate();
  const exam = getExam();
  const totalQuestions = getQuestions().length;

  // Question-count options, limited to what is actually available.
  const countOptions: (number | "all")[] = [
    ...(totalQuestions >= 5 ? [5 as const] : []),
    ...(totalQuestions >= 10 ? [10 as const] : []),
    "all" as const,
  ];
  const [count, setCount] = useState<number | "all">(totalQuestions >= 10 ? 10 : "all");

  const start = (mode: string, sessionCount: number | "all") => {
    quiz.startSession(mode, sessionCount);
    navigate({ to: "/quiz" });
  };

  const resumeTotal = quiz.session?.questionIds.length ?? 0;
  const resumePosition = (quiz.session?.currentIndex ?? 0) + 1;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-6">
        <header className="mb-6">
          <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Unofficial practice
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{exam.name}</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {exam.fullName} · Study target {exam.passTarget}%
          </p>
          <p className="mt-2 text-sm text-foreground/90">
            Pick a topic, answer, learn why. Your progress stays on this device.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {quiz.hydrated && quiz.session && !quiz.finished && resumeTotal > 0 && (
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RotateCcw className="size-4 text-primary" aria-hidden="true" />
                  Resume quiz (question {resumePosition} of {resumeTotal})
                </CardTitle>
                <CardDescription>
                  You left a practice session unfinished. Pick up where you stopped.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ProgressBar current={resumePosition} total={resumeTotal} />
                <div className="flex gap-2">
                  <Button asChild className="min-h-12 flex-1">
                    <Link to="/quiz">Resume</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-12"
                    onClick={quiz.quit}
                    aria-label="Discard saved session"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Start practice</CardTitle>
              <CardDescription>
                Questions from every topic, weighted like the real exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {quiz.hydrated && (
                <div
                  role="group"
                  aria-label="Number of questions"
                  className={cn("grid gap-2", countOptions.length === 3 ? "grid-cols-3" : "grid-cols-1")}
                >
                  {countOptions.map((option) => (
                    <Button
                      key={String(option)}
                      variant={count === option ? "default" : "outline"}
                      aria-pressed={count === option}
                      className="min-h-12"
                      onClick={() => setCount(option)}
                    >
                      {option === "all" ? `All (${totalQuestions})` : `${option} questions`}
                    </Button>
                  ))}
                </div>
              )}
              <Button size="lg" className="h-14 w-full text-base font-semibold" onClick={() => start("mixed", count)}>
                <Play className="size-5" aria-hidden="true" />
                Start practice
              </Button>
            </CardContent>
          </Card>

          {quiz.hydrated && quiz.weakCount > 0 && (
            <Button
              variant="outline"
              className="min-h-12 justify-between rounded-xl px-4 py-3 text-left"
              onClick={() => start("weak", "all")}
            >
              <span className="flex items-center gap-2">
                <Dumbbell className="size-4 text-primary" aria-hidden="true" />
                Practice my weak questions ({quiz.weakCount})
              </span>
            </Button>
          )}

          <section aria-labelledby="topics-heading" className="pt-2">
            <h2 id="topics-heading" className="mb-3 text-lg font-semibold text-foreground">
              Or focus on a topic
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {getDomains().map((domain) => (
                <TopicCard
                  key={domain.id}
                  domain={domain}
                  questionCount={getQuestionsByDomain(domain.id).length}
                  onStart={() => start(domain.id, count)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
