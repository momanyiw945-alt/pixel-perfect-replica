# AZ-900 Smart Quiz (Unofficial)

> **Unofficial study tool. Not affiliated with or endorsed by Microsoft.**
> All questions and explanations are original. They are based on the public AZ-900 skills outline on Microsoft Learn, not on real exam questions.

**Live demo:** https://az900-smart-quiz.lovable.app

Built for the Power Learn Project **Vibe Coding Hackathon: AZ-900 Exam Prep Edition** (#1MillionDevs Movement), for the **Practice & Assessment: Smart Quiz Builder** challenge.

<!-- TODO: add 2-3 screenshots here (home, a question after answering, results) -->

## Who it is for

Beginner cloud learners, especially in Africa, who study on phones with limited data. The tone is encouraging and the language is plain English.

## What it does

- **Practice by topic or mixed.** Three topics that follow the AZ-900 skills areas. "Mixed" practice picks questions in proportion to each topic's weight in the skills outline.
- **Instant feedback with a clear explanation, for every answer.** After you answer you see "Explain it simply" (a plain-English definition with an everyday African analogy), "Why this is right", and, if you want it, why each of the other options is wrong.
- **Practise your weak spots.** The app remembers which questions you last got wrong and offers a "Practice my weak questions" round.
- **Results screen.** Score ring, topic-by-topic bars, longest streak, your weakest topic with a one-tap "Practice this topic", and "Retry missed questions" for the ones you got wrong.
- **Resume where you stopped.** Refreshing the page or closing the tab does not lose your quiz.
- **Optional Kiswahili help.** A language toggle appears only on questions that have a Kiswahili explanation. English is always shown and is the reference.
- **Built for phones.** Large tap targets, a Next button that stays within reach, keyboard shortcuts (1-4 to answer, Enter for next), system dark mode, reduced-motion support.
- **No account, no backend.** Your progress is stored only in your browser (localStorage). A "Learn more" link on each question opens Microsoft Learn and is labelled as using more data.

## Content and accuracy

- **30 original questions:** Cloud Concepts (8), Azure Architecture & Services (12), Azure Management & Governance (10).
- **Skills outline weights used:** Cloud concepts 25-30%, Architecture and services 35-40%, Management and governance 30-35% (from the AZ-900 study guide on Microsoft Learn, skills measured as of 20 July 2026).
- **The 70% shown in the app is a study target, not the real pass mark.** The official passing score is 700 on a scaled 1-1000 basis, which does not map to 70% of questions correct.

**Source check log.** Each question below was checked against Microsoft Learn pages while building this project, and now links to a specific Learn module:

`cc-01, cc-04, as-02, as-05, as-06, as-07, as-08, as-09, as-10, as-11, as-12, mg-02, mg-03, mg-04, mg-05, mg-06, mg-08, mg-09` (18 of 30).

Two were corrected after checking:
- `as-08` (storage redundancy): removed cost claims that could not be confirmed on Learn; the question now rests on the confirmed behaviour of ZRS, LRS and the geo-redundant options.
- `as-09` (storage tiers): Azure now also has a Cold access tier, so "the three tiers" wording was corrected.

The remaining 12 questions (`cc-02, cc-03, cc-05, cc-06, cc-07, cc-08, as-01, as-03, as-04, mg-01, mg-07, mg-10`) cover basic concepts and were written against the skills outline, but have **not** been individually source-checked yet. Their "Learn more" link points to the AZ-900 study guide. <!-- TODO: update this list if you check more questions before submitting -->

**Kiswahili:** the Kiswahili explanations (11 questions) were drafted with AI and have **not** been reviewed by a fluent speaker. Azure terms are kept in English. Treat the English text as the reference.

Microsoft Learn changes over time. If you spot something out of date, please open an issue.

## Edit or add questions (`src/data/exam.json`)

All exam content lives in one file, `src/data/exam.json`, and is loaded only through `src/lib/examData.ts`. Topics, counts and weights shown in the app come from the data, so you do not edit code to add a question.

```jsonc
{
  "exam": {
    "id": "az-900",
    "name": "AZ-900 Smart Quiz",
    "fullName": "Microsoft Azure Fundamentals",
    "passTarget": 70,                       // study target in %, not the official score
    "domains": [
      { "id": "cloud-concepts", "name": "Cloud Concepts", "description": "...",
        "icon": "Cloud", "weightMin": 25, "weightMax": 30 }
    ],
    "languages": [ { "code": "sw", "name": "Kiswahili" } ]
  },
  "questions": [
    {
      "id": "cc-09",
      "domainId": "cloud-concepts",         // must match a domain id
      "topic": "Consumption-based model",
      "difficulty": "easy",                 // easy | medium | hard
      "question": "Which billing idea means you pay only for what you use?",
      "options": [                          // 2 to 4 options
        { "id": "a", "text": "Consumption-based", "whyCorrectOrWrong": "Correct. ..." },
        { "id": "b", "text": "Fixed up-front", "whyCorrectOrWrong": "Not quite. ..." }
      ],
      "correctOptionId": "a",
      "plainEnglish": "A plain-English definition with an everyday example.",
      "plainEnglishLocal": { "sw": "Optional local-language version." },
      "learnMoreUrl": "https://learn.microsoft.com/..."
    }
  ]
}
```

Rules enforced on load (a bad question is skipped and a `[examData]` warning appears in the browser console):
- `domainId` must match a domain, and `correctOptionId` must be present.
- A question needs 2 to 4 options.
- A `plainEnglishLocal` entry is dropped if its language code is not listed under `languages`, or its text is empty.
- Domain `icon` can be `Cloud`, `Server` or `ShieldCheck`; anything else falls back to a book icon.

To reuse the app for another exam, replace `exam.json` with a new exam file and redeploy or fork. (There is no in-app exam picker.)

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:8080/.

## Tech stack

TanStack Start with TanStack Router (file-based routes), React, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, Vitest. The app renders on the server first, so browser storage is only read after the page has loaded in the browser.

## How it was built

Built with **Lovable** (free plan) and **Claude** for planning, writing the question bank, reviewing code and fixing bugs. A summary of the prompts and what I learned is in [`PROMPTS.md`](./PROMPTS.md).

Honest notes:
- Lovable's free plan has a small daily credit limit, so some parts were written or fixed by hand in VS Code instead of by prompt. This includes the Results screen and the retry-missed feature.
- Source checking of questions was done by reading Microsoft Learn pages, and some wording was corrected as a result (see the log above).

## Known limitations

- Progress is stored only in your own browser, so it does not sync between devices.
- Only 30 questions so far; some topics from the skills outline (for example Defender for Cloud, Conditional Access, Azure Monitor) are not covered yet.
- Kiswahili is available on 11 of 30 questions and has not yet been reviewed by a native speaker.
- This is a study aid and cannot predict an official exam result.

## Roadmap

- More questions for the uncovered topics.
- Best score per topic on the home screen.
- A readiness panel using per-question history.
- Native-speaker review of the Kiswahili text, and more languages.
- Question banks for other certifications.

## Disclaimer

This project is an independent learning tool. It does not use Microsoft logos and is not affiliated with, authorised or endorsed by Microsoft. "Microsoft", "Azure" and related names belong to their respective owners.