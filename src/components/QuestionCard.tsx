import { Flame, Gauge, X } from "lucide-react";

import { OptionButton, type OptionState } from "@/components/OptionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import type { Question } from "@/types/quiz";

interface QuestionCardProps {
  question: Question;
  /** 1-based position in the session. */
  position: number;
  total: number;
  optionOrder: string[];
  chosenOptionId: string | null;
  currentStreak: number;
  onAnswer: (optionId: string) => void;
  onQuit: () => void;
}

export function QuestionCard({
  question,
  position,
  total,
  optionOrder,
  chosenOptionId,
  currentStreak,
  onAnswer,
  onQuit,
}: QuestionCardProps) {
  const answered = chosenOptionId !== null;
  const chosenCorrect = chosenOptionId === question.correctOptionId;

  const stateFor = (optionId: string): OptionState => {
    if (!answered) return "idle";
    if (optionId === question.correctOptionId) {
      return optionId === chosenOptionId ? "chosen-correct" : "correct-reveal";
    }
    if (optionId === chosenOptionId) return "chosen-wrong";
    return "muted";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <ProgressBar current={position} total={total} />
          </div>
          <Button
            variant="ghost"
            className="min-h-12 shrink-0"
            onClick={onQuit}
            aria-label="Quit quiz and go back to topics"
          >
            <X className="size-4" aria-hidden="true" />
            Quit
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Gauge className="size-3.5" aria-hidden="true" />
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">{question.topic}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold leading-snug text-foreground">{question.question}</h2>

      <div className="flex flex-col gap-2" role="group" aria-label="Answer options">
        {optionOrder.map((optionId, i) => {
          const option = question.options.find((o) => o.id === optionId);
          if (!option) return null;
          return (
            <OptionButton
              key={optionId}
              index={i + 1}
              option={option}
              state={stateFor(optionId)}
              onSelect={() => onAnswer(optionId)}
            />
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-6 text-center">
        {answered && (
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
            <span className={chosenCorrect ? "text-success" : "text-destructive"}>
              {chosenCorrect ? "Correct!" : "Not quite"}
            </span>
            {currentStreak >= 3 && (
              <span className="inline-flex items-center gap-1 text-accent-foreground">
                <Flame className="size-4" aria-hidden="true" />
                {currentStreak} in a row
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
