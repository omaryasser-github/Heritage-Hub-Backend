# Phase 4: User Interactions (Ratings, Reports, Notifications)

## Objective
Implement endpoints for interactive user signals, including rating upserts, content inaccuracy reports, and in-app notifications.

## Scope
*   **In Scope:**
    *   Implement user rating upserts (`POST /v1/ratings`) with proper create-or-update semantic checks (preventing duplicate rows per user/entity pair).
    *   Expose report submission routes (`POST /v1/reports`, `GET /v1/me/reports`) with standardized `target_type` parameters matching the ER model.
    *   Implement notifications inbox retrieval (`GET /v1/notifications`).
    *   Expose read status modification routes (`POST /v1/notifications/:id/read` and the missing `POST /v1/notifications/read-all`).
    *   Enforce transactional writes when recording user interaction events (`USER_INTERACTION`) for AI telemetry.
*   **Out Scope:**
    *   Real-time push gateway integrations (APNS/FCM) (notification objects are saved to the database and fetched via REST for Phase 4).
    *   Moderator panels to review reports (deferred to Phase 7 / Admin panels).

## Dependencies / Entry Criteria
- Phase 3 complete with core entities (`City`, `Monument`) existing in the database so ratings and reports can resolve foreign keys.
- Agreed semantic conventions for target fields resolved (e.g., standardizing on `target_type` and `target_id` across reports).

## Folder Structure
```text
src/modules/
├── feedback/
│   ├── feedback.module.ts
│   ├── controllers/
│   │   ├── ratings.controller.ts
│   │   └── reports.controller.ts
│   ├── services/
│   │   ├── ratings.service.ts
│   │   └── reports.service.ts
│   └── dto/
│       ├── rating-upsert.dto.ts         # Enforces stars bounds (1-5)
│       └── report-create.dto.ts         # target_type validation
└── notifications/
    ├── notifications.module.ts
    ├── notifications.controller.ts
    └── notifications.service.ts
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `POST /v1/ratings` (Protected)
  - `POST /v1/reports` (Protected)
  - `GET /v1/me/reports` (Protected)
  - `GET /v1/notifications` (Protected)
  - `POST /v1/notifications/:id/read` (Protected)
  - `POST /v1/notifications/read-all` (Protected)
- **Entities:**
  - `Rating`
  - `Report`
  - `Notification`
  - `UserInteraction`

## Acceptance Criteria
- [ ] Submitting a rating for an item that the user has already rated updates the star score in-place and updates the `updated_at` timestamp without generating duplicate rows.
- [ ] Calling `POST /v1/notifications/read-all` updates all unread notifications belonging to the logged-in user to `is_read: true`.
- [ ] Users cannot read or delete notifications belonging to other users (ownership guard validation checks).
- [ ] A user is blocked from submitting more than 3 reports per day (throttling check).

## Risks & Open Questions
- Recording detailed user interactions (`USER_INTERACTION`) can generate thousands of database inserts. If performance degrades, these logs must be offloaded to an asynchronous Redis queue (BullMQ).
