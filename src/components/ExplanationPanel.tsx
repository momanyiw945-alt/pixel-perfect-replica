import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getLanguages, hasLocalText } from "@/lib/examData";
import { getPrefs, setPrefs } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";

interface ExplanationPanelProps {
  question: Question;
}

// Segmented control built from the exam's configured languages. The choice is
// persisted via prefs; prefs are read in an effect so server and client
// markup stay identical.
function LanguageToggle({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
}) {
  const languages = getLanguages();
  return (
    <div
      role="group"
      aria-label="Explanation language"
      className="mt-2 inline-flex overflow-hidden rounded-lg border"
    >
      <Button
        type="button"
        variant="ghost"
        aria-pressed={value === null}
        className={cn(
          "min-h-12 rounded-none px-4 text-xs font-semibold",
          value === null && "bg-secondary text-secondary-foreground"
        )}
        onClick={() => onChange(null)}
      >
        English
      </Button>
      {languages.map((language) => (
        <Button
          key={language.code}
          type="button"
          variant="ghost"
          aria-pressed={value === language.code}
          className={cn(
            "min-h-12 rounded-none border-l px-4 text-xs font-semibold",
            value === language.code && "bg-secondary text-secondary-foreground"
          )}
          onClick={() => onChange(language.code)}
        >
          {language.name}
        </Button>
      ))}
    </div>
  );
}

export function ExplanationPanel({ question }: ExplanationPanelProps) {
  const [showOthers, setShowOthers] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    setShowOthers(false);
  }, [question.id]);

  useEffect(() => {
    setLanguage(getPrefs().language);
  }, []);

  const correctOption = question.options.find((o) => o.id === question.correctOptionId);
  const otherOptions = question.options.filter((o) => o.id !== question.correctOptionId);

  const changeLanguage = (code: string | null) => {
    setLanguage(code);
    setPrefs({ language: code });
  };

  const hasLocal = hasLocalText(question);
  const localText = language ? question.plainEnglishLocal?.[language] : undefined;

  return (
    <section aria-label="Explanation" className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Explain it simply</h3>
          {hasLocal && <LanguageToggle value={language} onChange={changeLanguage} />}
        </div>
        <p className="mt-2 text-sm text-foreground">{question.plainEnglish}</p>
        {hasLocal && language && !localText && (
          <p className="mt-2 text-xs italic text-muted-foreground">
            Not available in {getLanguages().find((l) => l.code === language)?.name ?? "this language"} for this question yet.
          </p>
        )}
        {hasLocal && language && localText && (
          <>
            <p className="mt-2 text-sm text-foreground">{localText}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Local-language help. The English version is the reference.
            </p>
          </>
        )}
      </div>

      {correctOption && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4">
          <h3 className="text-sm font-semibold text-foreground">Why this is right</h3>
          <p className="mt-2 text-sm text-foreground">{correctOption.whyCorrectOrWrong}</p>
        </div>
      )}

      <div>
        <button
          type="button"
          aria-expanded={showOthers}
          onClick={() => setShowOthers((open) => !open)}
          className="flex min-h-12 w-full items-center justify-between rounded-xl border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {showOthers ? "Hide why the others are wrong" : "See why the others are wrong"}
          {showOthers ? (
            <ChevronUp className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </button>
        {showOthers && (
          <ul className="mt-2 flex flex-col gap-2">
            {otherOptions.map((option) => (
              <li key={option.id} className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{option.text}</p>
                <p className="mt-1 text-sm text-muted-foreground">{option.whyCorrectOrWrong}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        href={question.learnMoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BookOpen className="size-4" aria-hidden="true" />
        Learn more (opens Microsoft Learn, uses more data)
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    </section>
  );
}
