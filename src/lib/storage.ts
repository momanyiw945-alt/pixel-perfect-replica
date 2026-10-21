// Single gateway for all localStorage access. Every read/write is wrapped in
// try/catch with an in-memory fallback, so storage problems never crash the app.

export interface QuizSession {
  mode: string;
  requestedCount: number | "all";
  questionIds: string[];
  optionOrder: Record<string, string[]>;
  currentIndex: number;
  answers: Record<string, string>;
  createdAt: number;
}

export interface QuestionStat {
  attempts: number;
  correct: number;
  lastCorrect: boolean | null;
  lastSeen: number;
}

export type Stats = Record<string, QuestionStat>;

export interface Prefs {
  language: string | null;
}

const KEYS = {
  stats: "quiz:stats:v1",
  session: "quiz:session:v1",
  prefs: "quiz:prefs:v1",
} as const;

// In-memory fallback used when localStorage is unavailable (private mode,
// disabled storage, or server-side rendering).
const memoryStore: Record<string, string> = {};
let localStorageOk: boolean | undefined;

function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  if (localStorageOk === undefined) {
    try {
      const probe = "__quiz_storage_probe__";
      window.localStorage.setItem(probe, probe);
      window.localStorage.removeItem(probe);
      localStorageOk = true;
    } catch {
      localStorageOk = false;
    }
  }
  return localStorageOk ? window.localStorage : null;
}

function readJSON<T>(key: string, fallback: T): T {
  const store = getStore();
  let raw: string | null = null;
  try {
    raw = store ? store.getItem(key) : (memoryStore[key] ?? null);
  } catch {
    raw = memoryStore[key] ?? null;
  }
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Malformed stored data is discarded; defaults are used, never thrown.
    try {
      if (store) store.removeItem(key);
      else delete memoryStore[key];
    } catch {
      delete memoryStore[key];
    }
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  const json = JSON.stringify(value);
  const store = getStore();
  try {
    if (store) store.setItem(key, json);
    else memoryStore[key] = json;
  } catch {
    memoryStore[key] = json;
  }
}

function removeKey(key: string): void {
  try {
    const store = getStore();
    if (store) store.removeItem(key);
    else delete memoryStore[key];
  } catch {
    delete memoryStore[key];
  }
}

// ---- Stats ----

export function getStats(): Stats {
  return readJSON<Stats>(KEYS.stats, {});
}

export function recordAnswer(questionId: string, correct: boolean): void {
  const stats = getStats();
  const prev = stats[questionId];
  stats[questionId] = {
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    lastCorrect: correct,
    lastSeen: Date.now(),
  };
  writeJSON(KEYS.stats, stats);
}

// ---- Session ----

export function saveSession(session: QuizSession): void {
  writeJSON(KEYS.session, session);
}

export function loadSession(): QuizSession | null {
  const session = readJSON<QuizSession | null>(KEYS.session, null);
  if (!session || typeof session !== "object") return null;
  if (!Array.isArray(session.questionIds)) return null;
  if (!session.questionIds.every((id) => typeof id === "string")) return null;
  if (typeof session.currentIndex !== "number") return null;
  if (!session.answers || typeof session.answers !== "object") return null;
  if (!session.optionOrder || typeof session.optionOrder !== "object") return null;
  return session;
}

export function clearSession(): void {
  removeKey(KEYS.session);
}

// ---- Preferences ----

export function getPrefs(): Prefs {
  const prefs = readJSON<Partial<Prefs>>(KEYS.prefs, {});
  return { language: typeof prefs.language === "string" ? prefs.language : null };
}

export function setPrefs(prefs: Prefs): void {
  writeJSON(KEYS.prefs, prefs);
}
