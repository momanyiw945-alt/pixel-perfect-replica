import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Option } from "@/types/quiz";

export type OptionState =
  | "idle"
  | "chosen-correct"
  | "chosen-wrong"
  | "correct-reveal"
  | "muted";

interface OptionButtonProps {
  /** 1-based label in display order. */
  index: number;
  option: Option;
  state: OptionState;
  onSelect: () => void;
}

export function OptionButton({ index, option, state, onSelect }: OptionButtonProps) {
  const locked = state !== "idle";
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      aria-pressed={state === "chosen-correct" || state === "chosen-wrong"}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        state === "idle" && "border-border bg-card hover:border-primary/50 hover:bg-accent/40",
        state === "chosen-correct" && "border-success bg-success/15",
        state === "chosen-wrong" && "border-destructive bg-destructive/10",
        state === "correct-reveal" && "border-success bg-success/10",
        state === "muted" && "border-border bg-card opacity-60"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          state === "idle" && "border-border bg-secondary text-secondary-foreground",
          state === "chosen-correct" && "border-success bg-success text-success-foreground",
          state === "chosen-wrong" && "border-destructive bg-destructive text-destructive-foreground",
          state === "correct-reveal" && "border-success bg-success text-success-foreground",
          state === "muted" && "border-border bg-secondary text-muted-foreground"
        )}
      >
        {index}
      </span>
      <span className="flex-1 text-sm text-foreground">{option.text}</span>
      {state === "chosen-correct" && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
          <Check className="size-4" aria-hidden="true" />
          Correct
        </span>
      )}
      {state === "correct-reveal" && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
          <Check className="size-4" aria-hidden="true" />
          Correct answer
        </span>
      )}
      {state === "chosen-wrong" && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-destructive">
          <X className="size-4" aria-hidden="true" />
          Not quite
        </span>
      )}
    </button>
  );
}
