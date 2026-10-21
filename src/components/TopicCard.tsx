import { ArrowRight } from "lucide-react";

import { formatWeight, getDomainIcon } from "@/lib/examData";
import { cn } from "@/lib/utils";
import type { DomainConfig } from "@/types/quiz";

interface TopicCardProps {
  domain: DomainConfig;
  questionCount: number;
  onStart: () => void;
  className?: string;
}

export function TopicCard({ domain, questionCount, onStart, className }: TopicCardProps) {
  const Icon = getDomainIcon(domain.icon);
  return (
    <button
      type="button"
      onClick={onStart}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold text-foreground">{domain.name}</span>
      <span className="text-sm text-muted-foreground">{domain.description}</span>
      <span className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-primary">
        {questionCount} {questionCount === 1 ? "question" : "questions"} · About{" "}
        {formatWeight(domain)} of the exam
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
