# Heritage Hub — Project Features & Architecture (Personal Reference)

A per-feature breakdown of the MVP backend, in build order. Endpoint paths match [api-endpoint-contract.md](./api-endpoint-contract.md).

> **Scope:** [ADR-003](./adr/ADR-003-mvp-scope.md) · **Naming:** [ADR-004](./adr/ADR-004-monument-api-naming.md) · **Phases:** [overview](./phases/overview.md) · **Contract:** [api-endpoint-contract.md](./api-endpoint-contract.md)

## Stack & Global Conventions (apply to every feature)

- **Runtime/Framework:** NestJS (TypeScript).
- **Database:** PostgreSQL · **ORM:** Prisma (ADR-002).
- **API style:** REST, resource-first, single mobile client, **no BFF**. Screen-aggregation: `GET /v1/home` only.
- **Versioning:** all routes under `/v1/`.
- **Auth (interim):** Bearer on content endpoints; public: `GET /v1/app/config` + `/v1/auth/*` (see contract for logout nuances). Guest mode deferred — [guest-mode-route-matrix.md](./guest-mode-route-matrix.md).
- **Response envelopes:** lists `{ data, cursor, has_next }`; errors `{ error: { code, message, details: {} } }`.
- **Entity refs (ADR-007):** ratings/reports/favorites use `cityId` / `monumentId`; only telemetry uses `entity_type` + `entity_id`.

---

## Feature 0 — Foundation

- **Endpoints:** `GET /v1/health` (internal), `GET /v1/app/config` (public).

## Feature 1 — Data Layer

- Prisma schema, ADR-007 CHECKs, seed from `Egypt-Tourism-landmarks.json`.

## Feature 2 — Authentication

- **Endpoints:** `POST /v1/auth/register`, `/login`, `/social`, `/refresh`, `/logout`, `/logout-all`, `/password/reset-request`, `/password/reset-confirm`.

## Feature 3 — User Profile & Settings

- **Endpoints:** `GET /v1/me`, `PATCH /v1/me`, `GET /v1/me/settings`, `PATCH /v1/me/settings`.

## Feature 4 — Devices & Push

- **Endpoints:** `POST /v1/devices/push-token`.

## Feature 5 — Cities

- **Endpoints:** `GET /v1/cities`, `GET /v1/cities/:cityId`.

## Feature 6 — Monuments (ADR-004)

- **Endpoints:** `GET /v1/monuments?city_id=&category=&kind=&cursor=&limit=`, `GET /v1/monuments/:monumentId`, `/awareness`, `/timeline`, `/media`.

## Feature 7 — Panorama

- **Endpoints:** `GET /v1/monuments/:monumentId/panorama`.

## Feature 8 — Home & Discovery

- **Endpoints:** `GET /v1/home`, `GET /v1/categories`, `GET /v1/search`, `GET /v1/search/suggestions`.

## Feature 9 — Favorites

- **Endpoints:** `GET /v1/me/favorites`, `POST /v1/favorites`, `DELETE /v1/favorites/:targetId` (monument or city — see contract).

## Feature 10 — Ratings & Reports

- **Endpoints:** `POST /v1/ratings`, `POST /v1/reports`, `GET /v1/me/reports`.

## Feature 11 — Personality Quiz

- **Endpoints:** `GET /v1/personality/quiz`, `POST /v1/personality/quiz/submit`, `GET /v1/me/personality`.

## Feature 12 — Recommendations Proxy

- **Endpoints:** `GET /v1/home` (cached For You feed). Signals: personality + [interaction-telemetry](./plans/interaction-telemetry.md).

## Feature 13 — Chatbot

- **Endpoints:** `GET/POST /v1/chat/sessions`, `GET/POST /v1/chat/sessions/:sessionId/messages`.

## Feature 14 — Notifications

- **Endpoints:** `GET /v1/notifications`, `POST /v1/notifications/:notificationId/read`, `POST /v1/notifications/read-all`.

## Feature 15 — Interaction Telemetry

- **Endpoints:** `POST /v1/interactions/batch` → BullMQ → `USER_INTERACTION`. Plan: [interaction-telemetry.md](./plans/interaction-telemetry.md).

---

## OUT OF SCOPE (MVP)

- Mobile gamification, gamified `/v1/quizzes/*`, admin dashboards, guest mode (interim).
- **Gamification showcase website** — supervisor prototype; not production API (ADR-003).

## Deferred / Future

Guest mode, caching, chat streaming, behavioral personality counters — see contract **Deferred** section.
