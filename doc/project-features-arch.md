# Heritage Hub — Project Features & Architecture (Personal Reference)

A per-feature breakdown of the MVP backend, in build order. For each feature: what it is, the architecture/approach, the flow, the tools, the entities, and the endpoints it touches.

> **Scope:** [ADR-003 MVP Scope](./adr/ADR-003-mvp-scope.md) · **Naming:** [ADR-004 Monument](./adr/ADR-004-monument-api-naming.md) · **Phases:** [overview](./phases/overview.md)

## Stack & Global Conventions (apply to every feature)

- **Runtime/Framework:** NestJS (TypeScript) — chosen winner (82.6%).
- **Database:** PostgreSQL.
- **ORM:** **Prisma** (ADR-002 — locked).
- **API style:** REST, resource-first, single mobile client, **no BFF**. Light screen-aggregation only where round-trips hurt (`GET /home`).
- **Versioning:** all routes under `/v1/` (enforced from day one).
- **Auth (interim):** short-lived access token + long-lived rotating refresh token (DB-backed, token family). All endpoints require auth **except** `GET /app/config` and `/auth/*`. Guest mode deferred — see [guest-mode-route-matrix.md](./guest-mode-route-matrix.md).
- **Response envelopes:** success lists use `{ data: [...], cursor: "", has_next: bool }`; errors use `{ error: { code, message, details } }`.
- **Pagination:** opaque cursor on all list endpoints (`?cursor=&limit=`).
- **Localization:** detail responses return both languages (`name_en`/`name_ar`); list/summary may return preferred language only.
- **AI integration (Pattern A):** separate FastAPI service; NestJS calls over HTTP.
- **Polymorphic FKs:** exclusive nullable FKs per [ADR-007](./adr/ADR-007-polymorphic-associations.md).

---

## Feature 0 — Foundation & Cross-Cutting Layer

- **Architecture:** NestJS modular monolith. Global config, logging, exception handling, response shaping.
- **Approach:** scaffold → ConfigModule → Prisma → global exception filter → response interceptor → `/v1/` prefix → health + app config → structured logging.
- **Tools:** NestJS CLI, `@nestjs/config`, **Prisma**, `class-validator`, Pino/Winston, Helmet, CORS, Throttler.
- **Endpoints:** `GET /health`, `GET /app/config` (public bootstrap).

---

## Feature 1 — Data Layer (ER Model & Migrations)

- **Architecture:** PostgreSQL schema from ER model; exclusive nullable FKs (ADR-007); bilingual fields.
- **Approach:** Prisma schema → ADR-007 CHECK constraints in migrations → seed from `Egypt-Tourism-landmarks.json`.
- **Required deltas:** Device/Session entity; USER `password_hash` + `auth_provider`; `updated_at` on cacheable entities; stable NOTIFICATION `id`.
- **Entities:** USER, SESSION, CITY, **MONUMENT** (`kind`: monument \| template), CATEGORY, MEDIA_ASSET, TIMELINE, AWARENESS, PANORAMA, HOTSPOT, FAVORITE, RATING, REPORT, NOTIFICATION, CHAT_*, PERSONALITY_PROFILE, USER_INTERACTION, RECOMMENDATION_SNAPSHOT. Gamification tables stubbed/deferred (ADR-003).

---

## Feature 2 — Authentication & Identity

- **Architecture:** Stateless access + stateful refresh (rotation + reuse detection). Interim: no guest mode.
- **Endpoints:** `POST /auth/register`, `/login`, `/social`, `/refresh`, `/logout`, `/logout-all`, `/password/reset-request`, `/password/reset-confirm`.

---

## Feature 3 — User Profile & Settings

- **Endpoints:** `GET /me`, `PATCH /me`, `GET /me/settings`, `PATCH /me/settings`.

---

## Feature 4 — Devices & Push Registration

- **Endpoints:** `POST /devices/push-token`.

---

## Feature 5 — Cities

- **Endpoints:** `GET /cities`, `GET /cities/:cityId`.

---

## Feature 6 — Monuments (incl. templates via `kind`)

- **Architecture:** Single `Monument` table. Templates filter via `?kind=template`. Bilingual, cursor-paginated. See ADR-004.
- **Endpoints:** `GET /monuments?kind=&category=&city_id=&cursor=&limit=`, `GET /monuments/:monumentId`, `/awareness`, `/timeline`, `/media`.

---

## Feature 7 — Panorama

- **Endpoints:** `GET /monuments/:monumentId/panorama`.

---

## Feature 8 — Home & Discovery

- **Endpoints:** `GET /home`, `GET /categories`, `GET /search`, `GET /search/suggestions`.

---

## Feature 9 — Favorites

- **Architecture:** Exclusive FK — `cityId` or `monumentId` per favorite row (ADR-007).
- **Endpoints:** `GET /me/favorites`, `POST /favorites`, `DELETE /favorites/:monumentId` (or city via body on POST).

---

## Feature 10 — Ratings & Reports

- **Architecture:** Rating upsert per (user, city|monument). Reports use `cityId` or `monumentId` in body — not `target_type` strings.
- **Endpoints:** `POST /ratings`, `POST /reports`, `GET /me/reports`.

---

## Feature 11 — Personality Onboarding Quiz (IN SCOPE)

- **Endpoints:** `GET /personality/quiz`, `POST /personality/quiz/submit`, `GET /me/personality`.

---

## Feature 12 — Recommendations Proxy (Pattern A — IN SCOPE)

- **Architecture:** HTTP client to FastAPI; cache in `RecommendationSnapshot`; feed `GET /home`.
- **Signals:** personality profile + user interactions (see [interaction-telemetry.md](./plans/interaction-telemetry.md)).

---

## Feature 13 — Chatbot

- **Architecture:** Sync REST proxy to FastAPI; streaming deferred.
- **Endpoints:** `GET/POST /chat/sessions`, `GET/POST /chat/sessions/:sessionId/messages`.

---

## Feature 14 — Notifications

- **Endpoints:** `GET /notifications`, `POST /notifications/:notificationId/read`, `POST /notifications/read-all`.

---

## Feature 15 — Interaction Telemetry (IN SCOPE)

- **Architecture:** Client batches events → `POST /interactions/batch` → Redis → BullMQ → `USER_INTERACTION`.
- **Plan:** [interaction-telemetry.md](./plans/interaction-telemetry.md).

---

## OUT OF SCOPE (MVP backend)

- **Mobile gamification:** leaderboards, achievements, XP/coins, challenges, learning paths.
- **Gamified quizzes:** `/monuments/:id/quizzes`, `/quizzes/:id/attempts`.
- **Admin dashboards.**
- **Guest mode** (interim auth wall — planned later).

### Gamification showcase website (separate prototype)

A teammate maintains a **standalone gamification showcase website** for supervisors. It uses mock/demo data — **not** the Heritage Hub production API. Mobile gamification remains deferred until post-MVP.

---

## Deferred / Future

- Guest mode — [guest-mode-route-matrix.md](./guest-mode-route-matrix.md)
- Caching (ETag / delta-sync)
- Panorama asset delivery internals
- Chat streaming (SSE)
- Behavioral personality counters
- 3rd language support
