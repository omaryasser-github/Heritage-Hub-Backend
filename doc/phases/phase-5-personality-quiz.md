# Phase 5: Personality Onboarding Quiz

## Objective
Implement endpoints to serve the static onboarding quiz, validate user responses, calculate their Travel Persona (e.g., Explorer, Historian), and update their database profile.

## Scope
*   **In Scope:**
    *   Expose an endpoint to fetch the static quiz layout (`GET /v1/personality/quiz`).
    *   Implement answer submission validation (`POST /v1/personality/quiz/submit`), parsing the 7 Likert scale inputs (1-5 values).
    *   Implement the scoring engine logic to derive the Travel Persona type based on submission weights:
        *   Personas: `Explorer`, `Historian`, `Strategist`, `Culture Lover`.
    *   Save the calculated persona to the user's `PersonalityProfile` entry.
    *   Provide a route to fetch the user's assessed personality (`GET /v1/me/personality`).
*   **Out Scope:**
    *   Dynamic or gamified quizzes (`/quizzes/*`) and leaderboard calculations (deferred/out of scope for MVP).
    *   Multi-criteria behavioral calculations (deferred to post-MVP; only the static quiz determines the persona for MVP).

## Dependencies / Entry Criteria
- Phase 2 (Auth & Identity) complete.
- Static quiz questionnaire (7 questions with category weighting) finalized and entered into the database seed files.

## Folder Structure
```text
src/modules/personality/
├── personality.module.ts
├── personality.controller.ts
├── personality.service.ts
└── dto/
    └── quiz-submit.dto.ts               # Validates answer arrays & Likert bounds
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `GET /v1/personality/quiz` (Protected)
  - `POST /v1/personality/quiz/submit` (Protected)
  - `GET /v1/me/personality` (Protected)
- **Entities:**
  - `User`
  - `PersonalityProfile`
  - `Question` (Only if quiz questions are loaded from database tables rather than JSON constants)

## Acceptance Criteria
- [ ] `GET /v1/personality/quiz` returns all onboarding questions with language localizations and option arrays.
- [ ] Submitting answers through `POST /v1/personality/quiz/submit` successfully updates the `PersonalityProfile` table mapping for the user.
- [ ] The submission endpoint returns the calculated travel persona string and the list of recommended categories mapped to that persona.
- [ ] Invalid answer arrays (e.g., scoring out of bounds, missing question answers) trigger standard HTTP 400 validation error responses.

## Risks & Open Questions
- Scoring algorithm must be deterministic and fully verified. If question weight balances are unequal, user types will bias heavily toward a single persona.
