# Prompts and how AZ-900 Smart Quiz was built

This project was built with **Lovable** (free plan) and **Claude**. This file records the prompts that built the app, what each one produced, and what I learned. It is honest about what went wrong, because that is where most of the learning was.

**The app itself contains no AI features.** There is no backend and no API call. Every explanation is written in advance and checked, so learners always see the same reviewed content. (An optional "explain it in my language" AI button was considered and deliberately left for later, because it needs a backend and an API key, and AI-generated explanations would need their own accuracy checks.)

## How I worked

1. **Plan first, with Claude.** I chose the Smart Quiz Builder challenge, then wrote down design decisions before building anything: config-driven content, per-question stats, session resume, weighted mixed practice, beginner-first explanations, optional Kiswahili, and what to cut.
2. **Write standing rules once** in Lovable's Project Knowledge, so every prompt stays short and consistent.
3. **One clear screen per prompt**, with exact data shapes, exact ids and the behaviour I expect (including accessibility), plus a fence at the end: "Only change what's described. Reply in 3 lines or fewer."
4. **Review the generated code myself**, with Claude, and fix problems by hand where that was cheaper than another prompt.

## Prompt-writing principles I used

- **Exact names and shapes.** Types, ids and file names are spelled out so the model cannot guess.
- **Config-driven content.** All exam content lives in one file and is validated on load, so a new exam is a new data file, not new code.
- **Behaviour, not only appearance.** Locking options after one tap, "Not quite" instead of "Wrong", never colour alone, keyboard shortcuts, focus management.
- **Scope fences.** "Do not change the data layer, the hook, Home" and "Only change what's described" stop a model from rewriting working parts.
- **Short replies.** "Reply in 3 lines or fewer" saves credits and avoids pasted code.
- **Remove-if-unwanted blocks.** Optional features (the language toggle) are wrapped in a clearly marked block.

## 1. Project Knowledge (standing rules)

**Goal:** make every later prompt shorter and keep the app consistent.

**First version (drafted before Prompt 1):**

```text
Project: "AZ-900 Smart Quiz", an UNOFFICIAL study app for the Microsoft
Azure Fundamentals exam. Audience: beginner cloud learners in Africa, mostly
on phones with limited data.

Standing rules for every change:
- Use the default stack (React, TypeScript, Tailwind, shadcn/ui, lucide-react
  icons). Add no new dependencies unless I ask.
- All quiz content lives in src/data/questions.json. Never hardcode questions
  or answer text in components.
- Never use Microsoft or Azure logos or icons. Use generic lucide icons only.
- Every page shows this footer: "Unofficial study tool. Not affiliated with
  or endorsed by Microsoft."
- Mobile-first. Tap targets at least 48px. WCAG AA contrast. Never rely on
  colour alone (pair with icons and text). Respect prefers-reduced-motion.
  Support light and dark mode.
- Tone: encouraging, plain English, beginner-friendly.
- Only change what the prompt describes. Keep replies to 3 lines or fewer.
  Do not paste code back to me.
```

**Final version (what is saved in Lovable now):**

```text
Project: an UNOFFICIAL, exam-agnostic multiple-choice study app, configured
for the Microsoft Azure Fundamentals exam (AZ-900). Audience: beginner cloud
learners in Africa, mostly on phones with limited data.

Standing rules for every change:
- Stack: the existing TanStack Start / TanStack Router file-based routes
  (src/routes), React, TypeScript, Tailwind, shadcn/ui, lucide-react. Do not
  use react-router. Add no other dependencies unless I ask.
- All exam content (exam name, domains, weights, questions) lives in
  src/data/exam.json. Never hardcode exam, domain or question text in
  components or types. Domains are derived from the data.
- Do not edit src/lib/examData.ts, src/lib/storage.ts or src/hooks/useQuiz.tsx
  unless the prompt names them. Reuse their exports.
- Never use Microsoft or Azure logos or icons. Generic lucide icons only.
- Every page shows this footer: "Unofficial study tool. Not affiliated with
  or endorsed by Microsoft."
- Mobile-first, tap targets at least 48px, WCAG AA contrast, never rely on
  colour alone (pair with icon and text), respect prefers-reduced-motion,
  follow the system light/dark setting.
- Tone: encouraging, plain English, beginner-friendly. Wrong answers say
  "Not quite", never "Wrong". One clear primary action per screen.
- Keep the app lightweight: no large assets, no extra libraries, no network
  calls except opening external links.
- All localStorage access goes through src/lib/storage.ts. The app renders on
  the server, so never read browser storage during render; wait for
  quiz.hydrated or use useEffect.
- Only change what the prompt describes. Reply in 3 lines or fewer. Do not
  paste code back to me.
```

**What I learned:** the first version was written before the project existed, and it showed. It named a file that was never created (`questions.json`; the real file is `exam.json`) and it did not say which router the project uses. After the first builds I rewrote it to name `exam.json` and the TanStack Router file routes (and ban react-router), make the app exam-agnostic with domains derived from the data, protect the data layer ("do not edit unless the prompt names them"), add the server-rendering rule (never read browser storage during render), and add the product rules ("Not quite", one primary action, keep it lightweight). Standing rules are cheap to write, but they have to match the real project.

## 2. Prompt 1: foundation and core quiz flow

**Goal:** the data layer, storage, state, routes, Home and the quiz screen in one go, with a placeholder Results page.

**Prompt (verbatim):**

```text
Build the foundation and the core quiz flow. Results polish, best scores and
confetti come in the next prompt, so skip them.

DATA (config-driven)
Create src/types/quiz.ts:
  interface DomainConfig { id: string; name: string; description: string;
    icon: string;          // a lucide icon name
    weightMin: number; weightMax: number }  // exam weighting in percent
  interface LanguageConfig { code: string; name: string }  // e.g. sw, Kiswahili
  interface ExamConfig { id: string; name: string; fullName: string;
    passTarget: number; domains: DomainConfig[];
    languages: LanguageConfig[] }  // optional local languages, may be empty
  interface Option { id: string; text: string; whyCorrectOrWrong: string }
  interface Question { id: string; domainId: string; topic: string;
    difficulty: "easy"|"medium"|"hard"; question: string; options: Option[];
    correctOptionId: string; plainEnglish: string;
    plainEnglishLocal?: Record<string, string>;  // language code -> text
    learnMoreUrl: string }
  interface ExamData { exam: ExamConfig; questions: Question[] }

Create src/data/exam.json matching ExamData:
- exam: id "az-900", name "AZ-900 Smart Quiz", fullName "Microsoft Azure
  Fundamentals", passTarget 70, languages [{ code: "sw", name: "Kiswahili" }],
  and 3 domains, using these EXACT ids:
  1) id "cloud-concepts", name "Cloud Concepts", weight 25-30, icon Cloud
  2) id "architecture-services", name "Azure Architecture & Services",
     weight 35-40, icon Server
  3) id "management-governance", name "Azure Management & Governance",
     weight 30-35, icon ShieldCheck
  Each with a short, beginner-friendly description. Every question's
  domainId must use one of these exact ids.
- questions: 15 ORIGINAL placeholder questions: 4 for Cloud Concepts, 6 for
  Architecture & Services, 5 for Management & Governance. 4 options each (ids
  a-d), a mix of difficulties. "topic" is a short sub-topic label such as
  "Availability zones". plainEnglish = 2-3 plain sentences that first define
  the key term in simple words, then give a short everyday analogy, ideally
  African (M-Pesa, market stall, matatu route). learnMoreUrl =
  https://learn.microsoft.com/training/.
- Add a sample plainEnglishLocal { "sw": "..." } (a short Swahili version of
  plainEnglish) to ONLY 2 of the questions, for testing the language toggle.
  The other 13 omit the field.
I will replace this file later.

Create src/lib/examData.ts as the ONLY place that imports exam.json. It
validates on load: skip any question with an unknown domainId, a missing
correctOptionId, or fewer than 2 or more than 4 options, and console.warn
the id. For plainEnglishLocal, drop any entry whose key is not in
exam.languages or whose value is not a non-empty string (warn, but keep the
question). Export: getExam(), getDomains(), getLanguages(), getQuestions(),
getQuestionsByDomain(id), formatWeight(domain) -> "25-30%",
hasLocalText(question) -> boolean, and anyLocalText() -> boolean (true if any
loaded question has local text). Map icon names to lucide components through
a small explicit lookup (not a wildcard import), with a generic fallback
icon.

STORAGE
Create src/lib/storage.ts: a localStorage wrapper with try/catch and an
in-memory fallback if storage is unavailable. Versioned keys. If stored JSON
is missing or malformed, discard it and continue with defaults, never throw.
Provide:
- recordAnswer(questionId, correct): updates a per-question stat
  { attempts, correct, lastCorrect, lastSeen } in "quiz:stats:v1".
- getStats(): all question stats.
- saveSession / loadSession / clearSession for "quiz:session:v1".
- getPrefs / setPrefs for "quiz:prefs:v1", with { language: string | null }.

STATE
Create a useQuiz hook (src/hooks/useQuiz.ts) wrapped in a QuizProvider so
Home, Quiz and Results share one session. It owns: mode, shuffled question
order, shuffled option order per question, current index, and answers
(questionId -> chosen option id). Actions: startSession(mode, count),
answer(optionId), next(), quit(), resume(). Modes: a domain id, "mixed",
"weak".
- "mixed": sample questions across domains in proportion to each domain's
  weight midpoint ((min+max)/2), using largest-remainder allocation, capped
  by how many questions each domain has, with any shortfall filled from
  domains that still have questions. When count is "All", use every question.
  Shuffle the result.
- "weak": questions whose latest stat has lastCorrect === false.
- A domain id: random questions from that domain up to count.
Shuffle once per session start. Derive score, per-domain results and the
current and longest correct-answer streak (consecutive correct answers in
order). answer() also calls recordAnswer.
Persist the in-progress session via saveSession after every change. The
provider must restore it synchronously on first render so a refresh mid-quiz
resumes at the same question with the same order. Discard a stored session if
any of its question ids no longer exist. Clear it on finish or quit.

ROUTES
/ (Home), /quiz, /results. /quiz and /results with no session redirect to /.

HOME (one clear primary action)
- Header with the exam name and a one-line encouraging tagline. Under it, one
  short how-it-works line: "Pick a topic, answer, learn why. Your progress
  stays on this device."
- If a saved session exists, show it first: "Resume quiz (question X of N)"
  with "Resume" and "Discard" actions.
- A prominent primary card "Start practice" (mixed, weighted) with the
  question-count selector (5 / 10 / All, limited to what's available, default
  10) and one large Start button.
- A section headed "Or focus on a topic": a card per domain (from config)
  showing icon, description, "X questions" and "About 25-30% of the exam"
  using formatWeight. Tapping a domain card starts a session with the
  selected count.
- A "Practice my weak questions (N)" card, only when N > 0.
- Responsive: 1 column on mobile, 2 to 3 on larger screens.

QUIZ
- Top bar: progress bar, "Question X of N", difficulty badge, topic label,
  Quit button.
- Options are labelled 1-4 (matching the keyboard shortcuts).
- On selecting an option: lock all options immediately, mark the chosen one
  correct (green + check icon + the word "Correct") or incorrect (red + X
  icon + the words "Not quite"), and always highlight the correct option.
  If the current streak is 3 or more, show a small flame icon with "X in a
  row".
- Then show an ExplanationPanel below the options, in this order:
  1) "Explain it simply" (plainEnglish), visible,
  2) "Why this is right": the correct option's whyCorrectOrWrong, visible,
  3) a toggle "See why the others are wrong", COLLAPSED by default, listing
     each other option with its whyCorrectOrWrong,
  4) a "Learn more" link in a new tab, labelled "Learn more (opens Microsoft
     Learn, uses more data)".

  LANGUAGE TOGGLE (remove this block if not wanted)
  In the "Explain it simply" section, show a small segmented control
  "English | Kiswahili" (built from exam.languages) ONLY when the current
  question has local text for at least one language (hasLocalText). If the
  chosen language has no text for this question, show English and the note
  "Not available in Kiswahili for this question yet." When a local language
  is shown, add the line "Local-language help. The English version is the
  reference." Remember the choice via getPrefs / setPrefs and default to
  English. Never show the toggle, or any empty space for it, when the
  question has no local text.

- The Next button is sticky at the bottom of the screen on mobile (respect the
  safe area, add bottom padding to the content so nothing is hidden), and
  appears only after answering. On the last question it reads "See results".
- Keyboard: keys 1-4 select an option before answering, Enter goes to
  Next / See results after answering. Visible focus rings, aria-live="polite"
  on the feedback message, and move focus to the Next button after answering.

RESULTS (placeholder)
"You scored X of N" and a "Back to topics" button that clears the session.

COMPONENTS
src/components: TopicCard, QuestionCard, OptionButton, ExplanationPanel,
ProgressBar, Footer.

Set the page title to "AZ-900 Smart Quiz (Unofficial)". Do not add auth, a
database, AI features, a timer or analytics. Reply in 3 lines or fewer.
```

**What happened:** this was too big. It used all 5 of the free plan's daily credits and stopped partway.

**What I learned:**
- Lovable charges for the work done, not per message, so one large prompt can use a whole day's credits.
- The prompt asked for `useQuiz.ts`, but the file contains JSX, which needs `.tsx`. The preview went blank until I renamed it by hand.
- I should have checked which router the project template uses before writing "ROUTES". It uses TanStack Router, and an earlier plan had assumed react-router. This is why the next prompt names TanStack explicitly.

## 3. Prompt 1b: the real quiz screen

**Goal:** replace the placeholder quiz route with the real quiz screen, without touching the data layer.

**Prompt (verbatim):**

```text
Replace the placeholder /quiz route with the real quiz screen. Use the
existing TanStack Router file routes (not react-router), the existing
useQuiz hook, and the existing helpers in src/lib/examData.ts and
src/lib/storage.ts. Do not change the data layer, the hook, Home, or the
standing rules. Do not add dependencies.

In src/routes/quiz.tsx:
- Keep the hydration guard: render an empty screen until quiz.hydrated. After
  that, if there is no session and quiz.finished is false, navigate to "/"
  (replace). If quiz.finished is true, navigate to "/results" (replace).
- Show quiz.currentQuestion. Render options in the order given by
  quiz.session.optionOrder[question.id]. The chosen answer is
  quiz.session.answers[question.id].

TOP BAR
ProgressBar, "Question X of N", a difficulty badge, the topic label, and a
Quit button (calls quiz.quit() then navigates to "/").

OPTIONS
Label options 1-4 in display order. On select call quiz.answer(optionId).
After answering, lock all options, mark the chosen one correct (green + check
icon + the word "Correct") or incorrect (red + X icon + the words "Not
quite"), and always highlight the correct option. If quiz.currentStreak is 3
or more, show a small flame icon with "X in a row". Tap targets at least
48px, never colour alone.

EXPLANATION PANEL (shown only after answering), in this order:
1) "Explain it simply": question.plainEnglish, visible.
2) "Why this is right": the correct option's whyCorrectOrWrong, visible.
3) A toggle "See why the others are wrong", COLLAPSED by default, listing each
   other option with its whyCorrectOrWrong.
4) A link "Learn more (opens Microsoft Learn, uses more data)" that opens
   question.learnMoreUrl in a new tab with rel="noopener noreferrer".

LANGUAGE TOGGLE (remove this block if not wanted)
In "Explain it simply", show a small segmented control "English | Kiswahili"
(built from getLanguages()) ONLY when hasLocalText(question) is true. If the
chosen language has no text for this question, show English plus the note
"Not available in Kiswahili for this question yet." When a local language is
shown add: "Local-language help. The English version is the reference."
Persist the choice with getPrefs/setPrefs, default English. Never show the
toggle or an empty gap when the question has no local text. Read prefs in a
useEffect so server and client markup match.

NEXT BUTTON
Appears only after answering. Sticky at the bottom on mobile (respect
safe-area-inset-bottom, add bottom padding to the content so nothing is
hidden). Reads "Next", or "See results" on the last question. Clicking calls
quiz.next(). When the last question has been answered, Next leads to
"/results" (the existing finished-state redirect handles this).

ACCESSIBILITY
Keys 1-4 select an option before answering. Enter activates Next after
answering. Visible focus rings. aria-live="polite" on the feedback message.
Move focus to the Next button after answering.

Put reusable pieces in src/components as QuestionCard, OptionButton and
ExplanationPanel. Reuse Footer. No timer, analytics, auth or AI. Only change
what's described. Reply in 3 lines or fewer.
```

**What happened:** it used the next day's 5 credits and finished some leftover work from Prompt 1 first, then paused with an "Add credits" message. The quiz components were still built and pushed to GitHub, so the "Paused" banner was misleading.

**What I learned:**
- A paused job can keep trying to finish old work first. I stopped clicking "Resume" and "Finish up" and sent fresh, small prompts instead.
- I then reviewed the generated code. It worked, with two gaps: the "not available in Kiswahili" note could never appear (it was wrapped inside a check that was only true when the question already had Kiswahili text), and a new question could open partly scrolled down on a phone. I fixed both by hand.
- Lovable's Chat mode is free, so I used it for questions and kept build prompts for real changes.

## 4. Prompt 2: results, retry and confetti (drafted, revised, then built by hand)

**Goal:** a real Results screen with a score ring, per-topic breakdown, weakest-topic card, "Retry missed questions" and confetti.

I drafted this as a Lovable prompt, then reviewed it against the real code before sending it and **did not send it**. The review found four problems:
1. The hook's `startSession(mode, count)` cannot start a session from a list of specific questions, so "Retry missed" needs a small hook change.
2. My standing rule says not to touch `useQuiz.tsx` or `storage.ts` unless the prompt names them, so the prompt would have had to name them.
3. The routing is TanStack Router, and the results page must keep the hydration guard.
4. Best-score saving would need a "retry" mode flag so that retries don't overwrite scores.

With 5 free credits a day and the earlier prompts having used all of them, I built this part by hand with Claude instead: a `startRetry` function in the hook, a full `results.tsx`, and a smoke test in a simulated browser (21 checks across four scenarios) before running it for real. "Best score on Home" was cut to protect the deadline.

## 5. Working with Claude

Beyond the build prompts, I used Claude as a planner, reviewer and fact-checker:

- **Context handoffs.** To continue across conversations without losing decisions, I wrote a handoff document with the plan, the decisions, the file layout and the known issues, and gave it to the next conversation.
- **Question bank.** Claude drafted 30 original questions from the public AZ-900 skills outline, in one fixed format (options a-d, a "why" for every option, a plain-English explanation with an everyday African analogy). None are copied from exam questions or dump sites.
- **Source-checking.** I had Claude check questions against Microsoft Learn pages, and two were corrected: one removed a cost claim that could not be confirmed (storage redundancy), and one was updated because Azure now also has a Cold storage tier. 18 of 30 are source-checked so far and now link to specific Learn modules.
- **Code review.** I pasted the Lovable-generated files into Claude to review them against the spec, which found the two gaps in section 3.
- **Safer edits.** For repeated changes, Claude wrote a small script that updates only the `learnMoreUrl` values in `exam.json`, and refuses to save if the file would stop being valid JSON.
- **Kiswahili.** Claude drafted the Kiswahili explanations. They have not been reviewed by a fluent speaker yet, so they are labelled as local-language help with English as the reference.

<!-- TODO: edit this section so it matches your real experience. Add anything you did differently. -->

## If I did it again

- Start with a small prompt for the data layer only, then one screen per prompt.
- Open the generated project and check the stack and file names before writing the next prompt.
- Keep the Project Knowledge in step with the real file names.
- Write the question bank and the checking log first, since content accuracy is what makes a study tool useful.