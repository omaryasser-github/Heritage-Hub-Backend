# Phase 1: Data Layer & Migrations

## Objective
Translate the ER model into PostgreSQL tables via **Prisma** migrations, applying ADR-007 exclusive nullable FKs and seeding from `Egypt-Tourism-landmarks.json`.

## Scope
*   **In Scope:**
    *   Initialize `prisma/schema.prisma` (Prisma only — ADR-002).
    *   **Polymorphic FK strategy (ADR-007):** exclusive nullable FKs (`city_id` / `monument_id` + CHECK constraints) for FAVORITE, RATING, REPORT, MEDIA_ASSET, AWARENESS_CARD, QUIZ. String-based refs for USER_INTERACTION only.
    *   **Monument model (ADR-004):** `Monument` table with `kind` enum (`monument` | `template`).
    *   Run initial migration + raw SQL CHECKs (`num_nonnulls`).
    *   Seed: categories, cities, monuments from JSON.
*   **Out Scope:**
    *   HTTP routes (Phase 3).
    *   Full gamification tables (stub or omit — ADR-003).

## Dependencies / Entry Criteria
- Phase 0 complete.
- Local PostgreSQL accessible.
- [ADR-007](../adr/ADR-007-polymorphic-associations.md), [ADR-004](../adr/ADR-004-monument-api-naming.md).

## Folder Structure
```text
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Entities (MVP)
- Core: `User`, `Session`, `City`, `Monument`, `Category`, `Panorama`, `Hotspot`, `MediaAsset`, `TimelineEvent`, `AwarenessCard`
- Interactive: `Favorite`, `Rating`, `Report`, `UserInteraction`, `Notification`
- AI: `PersonalityProfile`, `ChatSession`, `ChatMessage`, `RecommendationSnapshot`
- Deferred stubs: gamification tables (QUIZ content quizzes, XP, Challenge — ADR-003)

## Acceptance Criteria
- [ ] `npx prisma migrate dev` succeeds on clean DB.
- [ ] Seed inserts categories, cities, monuments from JSON.
- [ ] Deleting a Monument cascades panorama, media, favorites, ratings (ADR-007).
- [ ] CHECK constraints enforce exclusive arc on rating/favorite/report.

## Risks & Open Questions
- Schema changes after Phase 1 require incremental migrations — coordinate with mobile types early.
