import rawExam from "@/data/exam.json";
import { BookOpen, Cloud, Server, ShieldCheck, type LucideIcon } from "lucide-react";

import type {
  DomainConfig,
  ExamConfig,
  ExamData,
  LanguageConfig,
  Question,
} from "@/types/quiz";

const data = rawExam as unknown as ExamData;

const languageCodes = new Set(data.exam.languages.map((l) => l.code));
const domainIds = new Set(data.exam.domains.map((d) => d.id));

const questions: Question[] = data.questions.filter((q) => {
  if (!domainIds.has(q.domainId)) {
    console.warn(`[examData] Skipping question "${q.id}": unknown domainId "${q.domainId}".`);
    return false;
  }
  if (!q.correctOptionId) {
    console.warn(`[examData] Skipping question "${q.id}": missing correctOptionId.`);
    return false;
  }
  if (q.options.length < 2 || q.options.length > 4) {
    console.warn(
      `[examData] Skipping question "${q.id}": has ${q.options.length} options, expected 2-4.`
    );
    return false;
  }
  if (q.plainEnglishLocal) {
    const cleaned: Record<string, string> = {};
    for (const [code, text] of Object.entries(q.plainEnglishLocal)) {
      if (!languageCodes.has(code) || typeof text !== "string" || text.trim() === "") {
        console.warn(
          `[examData] Dropping plainEnglishLocal entry "${code}" on question "${q.id}".`
        );
        continue;
      }
      cleaned[code] = text;
    }
    if (Object.keys(cleaned).length > 0) {
      q.plainEnglishLocal = cleaned;
    } else {
      delete q.plainEnglishLocal;
    }
  }
  return true;
});

export function getExam(): ExamConfig {
  return data.exam;
}

export function getDomains(): DomainConfig[] {
  return data.exam.domains;
}

export function getLanguages(): LanguageConfig[] {
  return data.exam.languages;
}

export function getQuestions(): Question[] {
  return questions;
}

export function getQuestionsByDomain(id: string): Question[] {
  return questions.filter((q) => q.domainId === id);
}

export function formatWeight(domain: DomainConfig): string {
  return `${domain.weightMin}-${domain.weightMax}%`;
}

export function hasLocalText(question: Question): boolean {
  return Boolean(
    question.plainEnglishLocal && Object.keys(question.plainEnglishLocal).length > 0
  );
}

export function anyLocalText(): boolean {
  return questions.some(hasLocalText);
}

// Explicit lookup (no wildcard import) with a generic fallback icon.
const ICONS: Record<string, LucideIcon> = {
  Cloud,
  Server,
  ShieldCheck,
};

export function getDomainIcon(name: string): LucideIcon {
  return ICONS[name] ?? BookOpen;
}
