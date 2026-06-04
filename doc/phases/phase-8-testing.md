# Phase 8: Testing & Quality

## Objective
Establish complete automated test coverage, including units validation, database integration tests, and end-to-end route validations.

## Scope
*   **In Scope:**
    *   Write unit tests for core services (hashing logic, scoring calculators, transaction rules) using Jest.
    *   Set up database-isolated integration tests (using transaction rollbacks or separate testing databases).
    *   Implement end-to-end (E2E) route tests with `Supertest` asserting statuses, Unified Error format, and role guards.
    *   Formulate a Postman test collection matching `Heritage-Hub-API` layout to run automated regression runs.
*   **Out Scope:**
    *   Mobile frontend UI regression runs (visual assertion is deferred to client-side QA).

## Dependencies / Entry Criteria
- Hardened backend routes (Phase 7 complete).
- Clean sandbox database initialized for migration and test runs.

## Folder Structure
```text
test/
├── jest-e2e.json                        # E2E test configuration properties
├── auth.e2e-spec.ts                     # Auth lifecycle integration tests
├── explore.e2e-spec.ts                  # City and items lookup integration tests
├── quiz.e2e-spec.ts                     # Personality quiz validation tests
└── postman/
    └── Heritage-Hub-API.json            # Postman runner regression suites
```

## Endpoints & Entities Touched
- All REST API endpoints and data model tables.

## Acceptance Criteria
- [ ] Running `npm run test` executes all service unit spec files successfully.
- [ ] Running `npm run test:e2e` spins up the sandbox database, executes migration scripts, performs endpoint runs, and cleans up state with zero failures.
- [ ] The E2E tests include assertions verifying:
    *   Token refresh families are invalidated correctly.
    *   Rating updates upsert data without duplicates.
    *   Incorrect parameters return formatted validation structures.
- [ ] Running the Postman collection via the CLI runner (Newman) reports 100% assertions passed.

## Risks & Open Questions
- **External Mocking:** E2E runs must mock calls to the external Python FastAPI service using tools like `msw` or NestJS overrides to ensure tests do not fail due to external API downtime.
