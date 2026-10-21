export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  weightMin: number;
  weightMax: number;
}

export interface LanguageConfig {
  code: string;
  name: string;
}

export interface ExamConfig {
  id: string;
  name: string;
  fullName: string;
  passTarget: number;
  domains: DomainConfig[];
  languages: LanguageConfig[];
}

export interface Option {
  id: string;
  text: string;
  whyCorrectOrWrong: string;
}

export interface Question {
  id: string;
  domainId: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: Option[];
  correctOptionId: string;
  plainEnglish: string;
  plainEnglishLocal?: Record<string, string>;
  learnMoreUrl: string;
}

export interface ExamData {
  exam: ExamConfig;
  questions: Question[];
}
