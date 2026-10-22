<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- This is "AZ-900 Smart Quiz", an unofficial, exam-agnostic multiple-choice study app for beginner cloud learners on phones with limited data.
- All exam content (exam name, domains, weights, questions) lives in `src/data/exam.json`; `src/lib/examData.ts` is the only module that imports it and validates it. Never hardcode exam, domain or question text in components or types.
- All localStorage access goes through `src/lib/storage.ts` (versioned keys, try/catch, in-memory fallback). The app renders on the server, so never read browser storage during render — gate on `quiz.hydrated` or read in `useEffect`.
- Session and answer state is owned by the `QuizProvider` (`src/hooks/useQuiz.ts`); components consume it via `useQuiz()`. Do not edit examData/storage/useQuiz unless the prompt names them.
- Routing is TanStack Router file routes under `src/routes` only; react-router is not used.
- Every page renders `<Footer />` with the disclaimer "Unofficial study tool. Not affiliated with or endorsed by Microsoft." Never use Microsoft or Azure logos/icons; generic lucide icons only.
- Design tokens (including `--success`) are defined in `src/styles.css`; never hardcode color classes in components. Tap targets ≥48px, WCAG AA contrast, never colour alone (icon + text), respect `prefers-reduced-motion`, follow the system light/dark setting.
- No new dependencies, no timer/analytics/auth/AI, no large assets; no network calls except opening external links. Tone: encouraging plain English — wrong answers say "Not quite", never "Wrong".
