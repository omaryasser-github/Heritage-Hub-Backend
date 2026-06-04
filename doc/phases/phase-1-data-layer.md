# Phase 1: Data Layer & Migrations

## Objective
Translate the 24+ entity ER model into physical PostgreSQL tables via ORM migrations, resolving naming inconsistencies and designing a clean polymorphic relations workaround.

## Scope
*   **In Scope:**
    *   Initialize database schema models in the ORM (Prisma Schema or TypeORM Entities).
    *   Set up connection pooling and logging limits inside the ORM connection.
    *   Establish database schema relations:
        *   **Standardize Naming:** Standardize polymorphic target fields (using `target_id` and `target_type` consistently across `REPORT`, `RATING`, `FAVORITE`, etc. to resolve naming inconsistencies like `entity_id` vs `target_id`).
        *   **Polymorphic FK strategy:** Map generic relations using **exclusive nullable foreign keys** (e.g., `city_id` and `monument_id` columns with checking constraints) instead of loose string columns, preserving database integrity.
    *   Run initial migration scripts to provision PostgreSQL.
    *   Write seeds for reference dataset (Cities, Categories, Monuments, Timelines, Panoramas, Hotspots, and AwarenessCards).
*   **Out Scope:**
    *   HTTP CRUD controller routes (deferred to Phase 3).
    *   API-level query logic or custom payload validations.

## Dependencies / Entry Criteria
- Phase 0 (Foundation & Project Setup) functionally complete.
- Local PostgreSQL instance is accessible.
- Finalized database entity relationships resolved (`HERITAGE_HUB_ERD.md`).

## Folder Structure
```text
prisma/ (or src/core/database/)
├── schema.prisma                # Relational model mappings and definitions
├── seed.ts                      # Seeding scripts for Cities, Category and Monuments
└── migrations/
    └── 20260605XXXXXX_init/
        └── migration.sql        # Executable SQL script for table provisions
```

## Endpoints & Entities Touched
- **Endpoints:**
  - None
- **Entities (24+):**
  - Core: `User`, `City`, `Monument`, `Category`, `Panorama`, `Hotspot`, `MediaAsset`, `TimelineEvent`, `AwarenessCard`
  - Auth: `Session` (Device token mapping)
  - Interactive: `Favorite`, `Rating`, `Report`, `ReportResponse`, `UserInteraction`, `Notification`
  - AI & Onboarding: `PersonalityProfile`, `ChatSession`, `ChatMessage`, `RecommendationSnapshot`
  - Gamification (Stubs for future): `Quiz`, `Question`, `QuizAttempt`, `Achievement`, `UserAchievement`, `XPTransaction`, `Challenge`

## Acceptance Criteria
- [ ] Database migrations execute successfully against a clean PostgreSQL database (`npx prisma migrate dev` or equivalent).
- [ ] Running the seeding script successfully inserts reference records for Cities, Categories, Monuments, and Panoramas.
- [ ] Cascading rules work correctly (e.g., deleting a `Monument` automatically deletes its linked `Panorama` and `Hotspot` records in test runs).
- [ ] Relational schema preserves foreign key constraints for all polymorphic tables using exclusive nullable columns with check constraints.

## Risks & Open Questions
- Modifying schemas after Phase 1 will require generating incremental migration scripts, which can lead to complications if fields mapped to the mobile application's static models are modified.
