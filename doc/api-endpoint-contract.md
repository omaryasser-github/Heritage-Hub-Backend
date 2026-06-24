# Heritage Hub API — Contract Documentation

## Overview

A REST API for the **Heritage Hub** mobile app (React Native / Expo). Single mobile client, **no BFF**. Resource-first with light screen-aggregation (`GET /home`).

> **Authority:** [ADR index](./adr/README.md) · **MVP scope:** [ADR-003](./adr/ADR-003-mvp-scope.md) · **Guest mode (planned):** [guest-mode-route-matrix.md](./guest-mode-route-matrix.md)

## Architecture Decisions (locked)

- **No BFF layer** — resource-first; screen-aggregation only where round-trips hurt (`GET /home`).
- **Auth (interim until guest mode):** all endpoints require auth **except** `GET /app/config` and `/auth/*`. Guest browsing is **planned** — see guest-mode-route-matrix.
- **Auth model:** short-lived access token (`Authorization: Bearer`) + rotating refresh token (SecureStore). DB-backed rotation + reuse detection via token family. **No** access-token blacklist.
- **Localization:** detail = both languages (`name_en` / `name_ar`); lists may return preferred language only.
- **Timestamps:** ISO 8601 UTC.
- **Monuments:** single `Monument` resource; templates via `kind` discriminator (`monument` | `template`). See [ADR-004](./adr/ADR-004-monument-api-naming.md).
- **ORM:** Prisma (ADR-002). Polymorphic relations: [ADR-007](./adr/ADR-007-polymorphic-associations.md).

## Global Conventions

- **Unified error envelope:** `{ "error": { "code": "STRING_ENUM", "message": "...", "details": {} } }`
- **Empty list:** HTTP 200 with `{ "data": [] }`. **Not found:** HTTP 404 with error envelope.
- **Cursor pagination:** `?cursor=&limit=` → `{ "data": [...], "cursor": "", "has_next": bool }`

---

## Implemented Endpoints (MVP)

### App Bootstrap

- `GET /app/config` — public bootstrap (feature flags, min app version).

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/social`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/password/reset-request`
- `POST /auth/password/reset-confirm`

### Devices & Push

- `POST /devices/push-token`

### User Profile & Settings

- `GET /me` · `PATCH /me`
- `GET /me/settings` · `PATCH /me/settings`

### Personality Quiz

- `GET /personality/quiz`
- `POST /personality/quiz/submit`
- `GET /me/personality`

### Home & Discovery

- `GET /home`
- `GET /categories`
- `GET /search`
- `GET /search/suggestions`

### Cities

- `GET /cities`
- `GET /cities/:cityId`

### Monuments

- `GET /monuments` — filter: `kind`, `category`, `city_id`, `cursor`, `limit`
- `GET /monuments/:monumentId`
- `GET /monuments/:monumentId/awareness`
- `GET /monuments/:monumentId/timeline`
- `GET /monuments/:monumentId/media`
- `GET /monuments/:monumentId/panorama`

### Favorites

- `GET /me/favorites`
- `POST /favorites` — body: `{ "cityId" }` or `{ "monumentId" }`
- `DELETE /favorites/:monumentId` — or city variant per implementation

### Ratings & Reports

- `POST /ratings` — body: `{ "monumentId" \| "cityId", "stars" }`
- `POST /reports` — body: `{ "monumentId" \| "cityId", "reason", "description?" }`
- `GET /me/reports`

### Interaction Telemetry

- `POST /interactions/batch` — batched user events for AI signals. See [interaction-telemetry.md](./plans/interaction-telemetry.md).

### Chatbot

- `GET /chat/sessions` · `POST /chat/sessions`
- `GET /chat/sessions/:sessionId/messages`
- `POST /chat/sessions/:sessionId/messages`

### Notifications

- `GET /notifications`
- `POST /notifications/:notificationId/read`
- `POST /notifications/read-all`

---

## Deferred (not MVP)

### Gamified content quizzes

- `GET /monuments/:monumentId/quizzes`
- `GET /quizzes/:quizId`
- `POST /quizzes/:quizId/attempts`

### Gamification (mobile + backend)

Leaderboards, achievements, XP/coins, challenges — **out of MVP**. Vision demonstrated via **separate gamification showcase website** (prototype, not this API). See ADR-003.

### Other deferred

- Guest mode public routes (interim: auth required)
- Caching (ETag / delta-sync)
- Panorama asset delivery internals
- Chat streaming (sync REST for MVP)
- Admin dashboards
- Behavioral personality counters (static quiz only for MVP)

---

## Push Notification Payload Contract

- `id` — NOTIFICATION id (dedupe + mark-read)
- `type` — enum
- `target_id` — referenced resource id
- `deep_link` — in-app deep link

Payloads are lightweight; client refetches localized content via API.

---

## Entity-Model Prerequisites

- **Device/Session** — refresh token + push token + platform + `last_seen`
- **USER** — nullable `password_hash`, `auth_provider`
- **`updated_at`** on cacheable entities; stable **`id`** on NOTIFICATION
- **Monument** — `kind` enum for monument vs template (ADR-004)

---

## Postman Environments

| Variable | Dev | Staging | Prod |
|---|---|---|---|
| `baseUrl` | `https://dev-api.heritagehub.example/v1` | `https://staging-api.heritagehub.example/v1` | `https://api.heritagehub.example/v1` |
| `accessToken` | secret | secret | secret |
| `refreshToken` | secret | secret | secret |

Bearer auth uses `{{accessToken}}` from the active environment.
