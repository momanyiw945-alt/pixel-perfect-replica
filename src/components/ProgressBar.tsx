import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  /** 1-based position within the session. */
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const value = total > 0 ? Math.round((current / total) * 100) : 0;
  const text = label ?? `Question ${current} of ${total}`;
  return (
    <div className="w-full">
      <Progress value={value} aria-label={text} />
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{text}</p>
    </div>
  );
}
