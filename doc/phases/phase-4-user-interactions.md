# Phase 4: User Interactions (Ratings, Reports, Notifications, Telemetry)

## Objective
Implement ratings, reports, notifications, and interaction telemetry batch intake.

## Scope
*   **In Scope:**
    *   Favorites: `GET /v1/me/favorites`, `POST /v1/favorites`, `DELETE /v1/favorites/:targetId` (ADR-007).
    *   Rating upserts (`POST /v1/ratings`) — body uses `cityId` or `monumentId` (ADR-007), not `target_type` strings.
    *   Reports (`POST /v1/reports`, `GET /v1/me/reports`) — same FK pattern.
    *   Notifications inbox + mark read + read-all.
    *   Interaction telemetry: `POST /v1/interactions/batch` per [interaction-telemetry.md](../plans/interaction-telemetry.md).
*   **Out Scope:**
    *   APNS/FCM delivery (objects saved; push deferred).
    *   Admin moderation panels.

## Dependencies / Entry Criteria
- Phase 3 complete (`City`, `Monument` in DB).
- [ADR-007](../adr/ADR-007-polymorphic-associations.md) rating/report FKs.

## Folder Structure
```text
src/modules/
├── feedback/
│   ├── ratings.controller.ts
│   ├── reports.controller.ts
│   └── dto/
│       ├── rating-upsert.dto.ts      # cityId XOR monumentId
│       └── report-create.dto.ts
├── notifications/
└── interactions/
    ├── interactions.controller.ts
    └── processors/interaction-batch.processor.ts
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `POST /v1/ratings` (Protected)
  - `POST /v1/reports` (Protected)
  - `GET /v1/me/reports` (Protected)
  - `GET /v1/notifications` (Protected)
  - `POST /v1/notifications/:notificationId/read` (Protected)
  - `POST /v1/notifications/read-all` (Protected)
  - `POST /v1/interactions/batch` (Protected)
  - `GET /v1/me/favorites`, `POST /v1/favorites`, `DELETE /v1/favorites/:targetId` (Protected)
- **Entities:** `Rating`, `Report`, `Notification`, `UserInteraction`, `Favorite`

## Acceptance Criteria
- [ ] Rating upsert updates in-place; no duplicate rows per user/monument or user/city.
- [ ] `read-all` marks all user notifications read.
- [ ] Interaction batch returns 202; events persist via Redis worker within 10s.
- [ ] Max 3 reports per user per day (throttle).

## Risks & Open Questions
- Redis unavailable → degraded direct DB write path (see telemetry plan).
