import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame, RotateCcw, Target } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";
import { getDomains, getExam } from "@/lib/examData";
import type { QuizSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [{ title: "Results — AZ-900 Smart Quiz (Unofficial)" }],
  }),
  component: ResultsPage,
});

// Guard: results only make sense for a finished session. Nothing is read from
// browser storage during render, so server and client markup match.
function ResultsPage() {
  const quiz = useQuiz();
  const navigate = useNavigate();

  useEffect(() => {
    if (!quiz.hydrated) return;
    if (!quiz.session) {
      navigate({ to: "/", replace: true });
    } else if (!quiz.finished) {
      navigate({ to: "/quiz", replace: true });
    }
  }, [quiz.hydrated, quiz.session, quiz.finished, navigate]);

  if (!quiz.hydrated || !quiz.session || !quiz.finished) {
    return <div className="min-h-screen" />;
  }

  return <ResultsView session={quiz.session} />;
}

// ---- Score ring ----

function ScoreRing({ percent }: { percent: number }) {
  // Starts empty, then fills after mount. motion-reduce removes the animation,
  // so people who prefer reduced motion see the final value straight away.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (shown ? percent : 0) / 100);

  return (
    <div role="img" aria-label={`Score: ${percent} percent`} className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          style={{ stroke: "var(--color-border)" }}
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap={percent > 0 ? "round" : "butt"}
          stroke="currentColor"
          className="text-primary transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percent}%</span>
      </div>
    </div>
  );
}

// ---- Confetti (CSS only, no library) ----

const CONFETTI_COLORS = ["bg-primary", "bg-success", "bg-destructive", "bg-accent", "bg-foreground"];
const CONFETTI_DRIFT = ["-40px", "30px", "-20px", "50px", "10px", "-60px"];

const confettiCss = `
@keyframes az-confetti-fall {
  from { transform: translate3d(0, -24px, 0) rotate(0deg); }
  to { transform: translate3d(var(--drift, 0px), 105vh, 0) rotate(720deg); }
}
@media (prefers-reduced-motion: reduce) {
  .az-confetti { display: none; }
}
`;

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37 + 11) % 100}%`,
    delay: `${((i * 13) % 12) / 10}s`,
    duration: `${2.6 + (i % 5) * 0.4}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    drift: CONFETTI_DRIFT[i % CONFETTI_DRIFT.length],
  }));

  return (
    <div
      aria-hidden="true"
      className="az-confetti pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      <style>{confettiCss}</style>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={cn("absolute top-0 block h-3 w-2 rounded-sm", piece.color)}
          style={
            {
              left: piece.left,
              "--drift": piece.drift,
              animation: `az-confetti-fall ${piece.duration} ease-in ${piece.delay} 1 both`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

// ---- Results screen ----

function ResultsView({ session }: { session: QuizSession }) {
  const quiz = useQuiz();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Start at the top and move focus to the heading for screen reader users.
  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);

  const exam = getExam();
  const domains = getDomains();

  const total = session.questionIds.length;
  const percent = total > 0 ? Math.round((quiz.score / total) * 100) : 0;
  const target = exam.passTarget;
  const onTrack = percent >= target;

  // One row per topic that was actually played in this session.
  const rows = domains.flatMap((domain) => {
    const result = quiz.perDomain[domain.id];
    if (!result || result.attempted === 0) return [];
    return [{ domain, ...result, ratio: result.correct / result.attempted }];
  });

  // Weakest topic: lowest score; if tied, the one with the bigger exam weight.
  // Only shown when two or more topics were played and something was missed.
  const weakest =
    rows.length >= 2
      ? [...rows].sort(
          (a, b) =>
            a.ratio - b.ratio ||
            b.domain.weightMin + b.domain.weightMax - (a.domain.weightMin + a.domain.weightMax)
        )[0]
      : undefined;
  const weakestToShow = weakest && weakest.ratio < 1 ? weakest : null;

  const missedIds = quiz.questions
    .filter((q) => {
      const chosen = session.answers[q.id];
      return chosen !== undefined && chosen !== q.correctOptionId;
    })
    .map((q) => q.id);
  const hasMissed = missedIds.length > 0;

  const retryMissed = () => {
    quiz.startRetry(missedIds);
    navigate({ to: "/quiz" });
  };

  const practiceWeakest = () => {
    if (!weakestToShow) return;
    quiz.startSession(weakestToShow.domain.id, 5);
    navigate({ to: "/quiz" });
  };

  const backToTopics = () => {
    quiz.quit();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {onTrack && <Confetti />}

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pb-6 pt-8">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-center text-xl font-semibold text-foreground outline-none"
        >
          Your results
        </h1>

        <section
          aria-label="Your score"
          className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center"
        >
          <ScoreRing percent={percent} />
          <p className="text-sm text-muted-foreground">
            {quiz.score} of {total} correct
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            {onTrack ? "You're on track!" : "Good effort. Keep practising!"}
          </h2>
          <p className="text-sm text-foreground">
            {onTrack
              ? `You scored ${percent}%, at or above our ${target}% study target. Keep mixing topics so it stays that way.`
              : `You scored ${percent}%. Our study target is ${target}%. Retry the questions you missed, then try again. Every round helps it stick.`}
          </p>
          <p className="text-xs text-muted-foreground">
            The {target}% target is a study guide only. The real exam uses a scaled score, so this
            cannot predict your official result.
          </p>
          {quiz.longestStreak >= 2 && (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
              <Flame className="size-4" aria-hidden="true" />
              Longest streak: {quiz.longestStreak} in a row
            </p>
          )}
        </section>

        <section aria-label="Results by topic" className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">By topic</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {rows.map(({ domain, correct, attempted, ratio }) => {
              const pct = Math.round(ratio * 100);
              return (
                <li key={domain.id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{domain.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {correct} of {attempted}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${domain.name} score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary"
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {weakestToShow && (
          <section
            aria-label="Topic to practise next"
            className="rounded-xl border border-primary/40 bg-primary/10 p-4"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="size-4" aria-hidden="true" />
              Practise next: {weakestToShow.domain.name}
            </h2>
            <p className="mt-2 text-sm text-foreground">
              You got {weakestToShow.correct} of {weakestToShow.attempted} right here. This topic is
              about {weakestToShow.domain.weightMin}-{weakestToShow.domain.weightMax}% of the exam,
              so it is worth another go.
            </p>
            <Button className="mt-3 min-h-12" variant="secondary" onClick={practiceWeakest}>
              Practice this topic
            </Button>
          </section>
        )}

        {!hasMissed && (
          <p className="text-center text-sm text-muted-foreground">
            You answered every question correctly, so there is nothing to retry. Great work!
          </p>
        )}
      </main>

      <div
        className="sticky bottom-0 border-t bg-background/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex w-full max-w-xl gap-2">
          <Button
            variant={hasMissed ? "default" : "outline"}
            className="h-12 flex-1"
            disabled={!hasMissed}
            onClick={retryMissed}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Retry missed ({missedIds.length})
          </Button>
          <Button
            variant={hasMissed ? "outline" : "default"}
            className="h-12 flex-1"
            onClick={backToTopics}
          >
            Back to topics
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}