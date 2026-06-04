# Heritage Hub — Project Features & Architecture (Personal Reference)

A per-feature breakdown of the MVP backend, in build order. For each feature: what it is, the architecture/approach, the flow, the tools, the entities, and the endpoints it touches.

## Stack & Global Conventions (apply to every feature)

- **Runtime/Framework:** NestJS (TypeScript) — chosen winner (82.6%).
    
- **Database:** PostgreSQL.
    
- **ORM:** TypeORM or Prisma (decide in Phase 0; Prisma recommended for type-safety with RN type-sharing).
    
- **API style:** REST, resource-first, single mobile client, **no BFF**. Light screen-aggregation only where round-trips hurt (`GET /home`).
    
- **Versioning:** all routes under `/v1/` (enforced from day one).
    
- **Auth:** short-lived access token (`Authorization: Bearer`, in client memory) + long-lived rotating refresh token (client SecureStore). Refresh tokens DB-backed with rotation + reuse detection via token family. Revocation at refresh layer; NO access-token blacklist.
    
- **Response envelopes:** success lists use `{ data: [...], cursor: "", has_next: bool }`; errors use `{ error: { code, message, details } }`. Empty list = 200 with `{ data: [] }`. Single resource not found = 404 envelope.
    
- **Pagination:** opaque cursor on all list endpoints (`?cursor=&limit=`).
    
- **Localization:** detail responses return both languages (`name_en`/`name_ar`); list/summary may return preferred language only (2 languages assumed).
    
- **Timestamps:** raw ISO 8601 UTC; client formats display text. `updated_at` on cacheable entities.
    
- **AI integration (Pattern A):** AI team runs a separate FastAPI/Python service; our NestJS backend calls it over HTTP (HttpModule/axios with timeouts, retries, fallback).
    

---

## Feature 0 — Foundation & Cross-Cutting Layer

_Build first; everything else depends on it._

- **Architecture:** NestJS modular monolith. Global modules for config, logging, exception handling, and response shaping.
    
- **Approach (in order):** scaffold NestJS project -> set up ConfigModule + `.env` per environment (Dev/Staging/Prod) -> wire PostgreSQL + ORM -> add global exception filter (unified error envelope) -> add response interceptor (data/cursor envelope) -> enable URI versioning (`/v1/`) -> add health-check endpoint -> set up structured logging.
    
- **Tools:** NestJS CLI, `@nestjs/config`, Prisma/TypeORM, `class-validator`/`class-transformer` (DTO validation), Pino/Winston (logging), Helmet, CORS, Throttler (rate limiting).
    
- **Entities touched:** none directly (infrastructure).
    
- **Endpoints:** `GET /health` (internal), `GET /app/config` (public bootstrap — feature flags, min app version).
    

---

## Feature 1 — Data Layer (ER Model & Migrations)

- **Architecture:** PostgreSQL schema translated from the existing ER model (24+ entities, polymorphic FKs, bilingual fields).
    
- **Approach (in order):** define ORM models/schema -> resolve polymorphic FK strategy (e.g. `target_type` + `target_id`) -> standardize field naming (reconcile `entity_type` vs `target_type`) -> generate migrations -> write seed scripts for cities/items/categories/quiz.
    
- **Required entity deltas:** add **Device/Session** entity (rotating refresh token/session + push token + platform + `last_seen`); USER gets nullable `password_hash` + `auth_provider`; `updated_at` on cacheable entities; stable `id` on NOTIFICATION.
    
- **Tools:** ORM migration tooling, SQL, seed scripts.
    
- **Entities:** USER, DEVICE/SESSION, CITY, ITEM (monument|template discriminator), CATEGORY, MEDIA, TIMELINE, AWARENESS, PANORAMA, QUIZ, QUESTION, OPTION, FAVORITE, RATING, REPORT, NOTIFICATION, CHAT_SESSION, CHAT_MESSAGE, PERSONALITY (+ profile), etc.
    

---

## Feature 2 — Authentication & Identity

- **Architecture:** Stateless access token + stateful (DB-backed) refresh token with rotation & reuse detection via token family. No guest mode — all endpoints require auth except `GET /app/config` and `/auth/\*`.
    
- **Approach (in order):** password hashing (argon2/bcrypt) -> register/login -> issue access+refresh pair -> store refresh in DEVICE/SESSION -> refresh rotation + reuse detection -> social login (auth_provider) -> logout / logout-all (revoke at refresh layer) -> password reset request/confirm -> auth guard + role/ownership decorators (fix any `auth: null` inconsistency).
    
- **Tools:** `@nestjs/jwt`, `@nestjs/passport`, Passport strategies (JWT, social), argon2/bcrypt.
    
- **Entities:** USER, DEVICE/SESSION.
    
- **Endpoints:** `POST /auth/register`, `POST /auth/login`, `POST /auth/social`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `POST /auth/password/reset-request`, `POST /auth/password/reset-confirm`.
    

---

## Feature 3 — User Profile & Settings

- **Architecture:** Standard authenticated CRUD on the current user.
    
- **Approach (in order):** `GET /me` profile -> `PATCH /me` partial update (DTO-validated) -> settings read/update.
    
- **Tools:** NestJS controllers/services, DTO validation, ownership guard.
    
- **Entities:** USER, USER_SETTINGS.
    
- **Endpoints:** `GET /me`, `PATCH /me`, `GET /me/settings`, `PATCH /me/settings`.
    

---

## Feature 4 — Devices & Push Registration

- **Architecture:** Device push token stored on the DEVICE/SESSION entity (shared backbone with auth).
    
- **Approach (in order):** register/update push token per device -> store platform + `last_seen`.
    
- **Tools:** NestJS service; later integrates with FCM/APNs (delivery is a QA/delivery-time concern, not contract).
    
- **Entities:** DEVICE/SESSION.
    
- **Endpoints:** `POST /devices/push-token`.
    

---

## Feature 5 — Cities

- **Architecture:** Read-only reference content, bilingual, cursor-paginated.
    
- **Approach (in order):** list cities (paginated) -> city detail (both languages).
    
- **Tools:** NestJS controllers/services, cursor pagination helper.
    
- **Entities:** CITY.
    
- **Endpoints:** `GET /cities`, `GET /cities/:cityId`.
    

---

## Feature 6 — Monuments & Templates (Items)

- **Architecture:** Monument & Template share ONE schema with a type discriminator (`monument` | `template`); same workflow, separate data. Resource-first, bilingual, cursor-paginated.
    
- **Approach (in order):** list items with filters (`type`, `category`, and add missing `city_id` filter) -> item detail -> sub-resources: awareness, timeline (resolve any route mismatch), media gallery.
    
- **Tools:** NestJS controllers/services, query filters, cursor pagination.
    
- **Entities:** ITEM, MEDIA, TIMELINE, AWARENESS, CATEGORY, CITY.
    
- **Endpoints:** `GET /items?type=&category=&cursor=&limit=`, `GET /items/:itemId`, `GET /items/:itemId/awareness`, `GET /items/:itemId/timeline`, `GET /items/:itemId/media`.
    
- **Note:** review `/items` naming vs the ER "template" terminology so they align.
    

---

## Feature 7 — Panorama

- **Architecture:** Panorama scene + hotspots attached to an item. Asset delivery internals (equirectangular vs tiled) left open for later.
    
- **Approach (in order):** serve panorama scene + hotspot metadata for an item.
    
- **Tools:** NestJS service; static/CDN asset delivery TBD.
    
- **Entities:** PANORAMA (linked to ITEM), HOTSPOT.
    
- **Endpoints:** `GET /items/:itemId/panorama`.
    

---

## Feature 8 — Home & Discovery

- **Architecture:** `GET /home` is the ONE allowed screen-aggregation endpoint (round-trip optimization). Categories + search are resource-first.
    
- **Approach (in order):** categories list -> search across items -> typeahead suggestions -> aggregate the home screen response.
    
- **Tools:** NestJS service composition; Postgres full-text search (or trigram) for search/suggestions.
    
- **Entities:** ITEM, CATEGORY, CITY (read aggregation).
    
- **Endpoints:** `GET /home`, `GET /categories`, `GET /search?q=&cursor=&limit=`, `GET /search/suggestions`.
    

---

## Feature 9 — Favorites

- **Architecture:** Per-user join between USER and ITEM, cursor-paginated.
    
- **Approach (in order):** list favorites -> add favorite -> remove favorite.
    
- **Tools:** NestJS controllers/services, ownership guard.
    
- **Entities:** FAVORITE (USER x ITEM).
    
- **Endpoints:** `GET /me/favorites`, `POST /favorites`, `DELETE /favorites/:itemId`.
    

---

## Feature 10 — Ratings & Reports

- **Architecture:** Rating is an **upsert** per (user, item) — POST acts as create-or-update. Reports are user-submitted content flags.
    
- **Approach (in order):** create/update rating (upsert semantics, one per user per item) -> submit report (reconcile field naming) -> list my reports (paginated).
    
- **Tools:** NestJS service with upsert logic, DTO validation.
    
- **Entities:** RATING, REPORT.
    
- **Endpoints:** `POST /ratings`, `POST /reports`, `GET /me/reports?cursor=&limit=`.
    

---

## Feature 11 — Personality Onboarding Quiz (IN SCOPE)

- **Architecture:** Static quiz; submission derives a personality result persisted to the user profile. Separate from the deferred gamified `/quizzes/\*` content. (Future: behavioral counters — quizzes/panoramas/favorites/interactions — as a second mechanism.)
    
- **Approach (in order):** fetch static quiz -> submit answers -> derive personality -> persist to user -> expose result.
    
- **Tools:** NestJS controllers/services; scoring logic in a service.
    
- **Entities:** QUIZ (personality), QUESTION, OPTION, PERSONALITY_PROFILE/USER.
    
- **Endpoints:** `GET /personality/quiz`, `POST /personality/quiz/submit`, `GET /me/personality`.
    

---

## Feature 12 — Recommendations Proxy (Pattern A — IN SCOPE)

- **Architecture:** Our NestJS backend calls the AI team's separate FastAPI/Python service over HTTP. We own the contract, auth between services, timeouts, retries, and fallback. AI/LLM fit kept low-weight precisely because we don't host the model.
    
- **Approach (in order):** define request/response contract with AI team -> build HTTP client module (timeouts + retries + circuit-breaker/fallback) -> service-to-service auth -> feed personality result + user signals -> map AI response into our envelope.
    
- **Tools:** `@nestjs/axios` (HttpModule), retry/circuit-breaker utility, DTO mapping.
    
- **Entities:** consumes USER + PERSONALITY signals; may persist a recommendations cache.
    
- **Endpoints:** internal recommendations endpoint(s) feeding `/home`/discovery (define exact route during build).
    

---

## Feature 13 — Chatbot

- **Architecture:** Chat sessions + messages, cursor-paginated. Responses synchronous for now; contract shaped so streaming can be added later. Backend likely proxies to the AI service (Pattern A).
    
- **Approach (in order):** list sessions -> create session -> list session messages -> send message + return reply (sync).
    
- **Tools:** NestJS controllers/services; `@nestjs/axios` to AI service; future streaming via SSE/WebSocket.
    
- **Entities:** CHAT_SESSION, CHAT_MESSAGE.
    
- **Endpoints:** `GET /chat/sessions`, `POST /chat/sessions`, `GET /chat/sessions/:sessionId/messages`, `POST /chat/sessions/:sessionId/messages`.
    

---

## Feature 14 — Notifications

- **Architecture:** In-app notification feed + push payload contract. Push payloads are lightweight (IDs + deep link); client refetches localized content. Dedupe + mark-as-read keyed on the stable NOTIFICATION `id`.
    
- **Approach (in order):** list notifications (paginated) -> mark one read -> (recommended add) mark-all read -> push payload carries `id`, `type`, `target_id`, `deep_link`.
    
- **Tools:** NestJS service; FCM/APNs at delivery time.
    
- **Entities:** NOTIFICATION (stable id), DEVICE/SESSION (push token).
    
- **Endpoints:** `GET /notifications?cursor=&limit=`, `POST /notifications/:notificationId/read`, _(recommended)_ `POST /notifications/read-all`.
    

---

## OUT OF SCOPE (Phase 1) — do NOT build yet

- Gamification: Leaderboards, Achievements/Badges, Challenges, Learning Paths.
    
- Guest mode / browse-before-login (conflicts with US-03/US-03b; reconcile if revived).
    
- Gamified quizzes (`/items/:itemId/quizzes`, `/quizzes/:quizId`, `POST /quizzes/:quizId/attempts`).
    
- Admin dashboards (content mgmt US-38, moderation US-39, analytics US-40).
    

## Deferred / Future (designed-for, not built now)

- Caching strategy (ETag / delta-sync) — `updated_at` already present, additive later.
    
- Panorama asset delivery internals.
    
- Chat streaming.
    
- Behavioral personality counters (second mechanism).
    
- 3rd language support (revisit localization payload).
