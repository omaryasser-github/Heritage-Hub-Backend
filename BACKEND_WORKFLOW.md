# Heritage Hub — Backend Development Workflow

> **Platform:** Node.js (NestJS Framework)  
> **Language:** TypeScript  
> **Database:** PostgreSQL with **Prisma** (ADR-002)  
> **AI Integration (Pattern A):** External Python (FastAPI) HTTP client proxy — **stub-first** until the AI service ships  
> **Localization:** Bilingual (Arabic / English) payload support  
> **Docs:** [ADR index](doc/adr/README.md) · [Phases](doc/phases/overview.md) · [API contract](doc/api-endpoint-contract.md)

---

## 1. Backend Overview

The Heritage Hub backend is a **modular REST API** built with NestJS and TypeScript. It serves as the single source of truth and primary gateway for the React Native (Expo) mobile client.

The backend is responsible for:

- Secure user authentication with database-backed **Refresh Token Rotation (RTR)**.
- Read APIs and filtering for cities, **monuments**, categories, timelines, awareness cards, and media.
- Proxying and caching AI workloads: chat sessions and recommendation snapshots (async refresh → PostgreSQL read).
- Processing, buffering, and logging high-frequency user interactions for AI signals ([interaction-telemetry plan](doc/plans/interaction-telemetry.md)).
- In-app notification inbox (list, mark read).
- Cross-cutting hardening: validation, rate limits, security headers, request tracing, OpenAPI docs.

**MVP scope** (ADR-003): personality quiz, recommendations proxy, core content — **not** mobile gamification. Gamification vision is demonstrated via a **separate showcase website** (supervisor prototype; mock data; not production API). **Guest mode** is planned after core architecture; interim rule: Bearer required on content routes; public: `GET /v1/app/config`, `GET /v1/health`, and `/v1/auth/*` (see [API contract](doc/api-endpoint-contract.md)).

**Panorama:** 360° panorama rendering is **frontend-only**. The contract lists `GET /v1/monuments/:id/panorama` for reference, but this backend does **not** implement that route — the mobile client loads panorama assets directly.

---

## 2. Implementation Status (Phases 0–7)

| Phase | Deliverable | Status |
|---|---|---|
| **0** | `/v1/health`, `/v1/app/config`, unified error envelope, global response wrapper | ✅ |
| **1** | Prisma schema, migrations, seed, ADR-007 CHECK constraints | ✅ |
| **2** | Register, login, refresh/logout RTR, `GET/PATCH /v1/me` | ✅ |
| **3** | Cities, monuments (+ awareness/timeline/media), categories, search | ✅ |
| **4** | Favorites, ratings, reports, notifications, `POST /v1/interactions/batch` | ✅ |
| **5** | Static personality quiz, scoring, `GET /v1/me/personality` | ✅ |
| **6** | `GET /v1/home`, AI chat proxy, `RecommendationSnapshot` + BullMQ refresh | ✅ (stub client default) |
| **7** | Helmet, CORS, Redis throttler, `x-request-id` tracing, sanitization, `/v1/docs` | ✅ |
| **8** | Expanded QA, Postman/Newman regression | 🔜 |
| **9** | Docker prod image, CI/CD, monitoring | 🔜 |

**Contract routes not yet implemented:** OAuth social login (`501`), password reset, `/me/settings`, `/devices/push-token`.

Fine-grained acceptance criteria: [doc/phases/overview.md](doc/phases/overview.md).

---

## 3. Architecture Approach

Modular / Domain-Driven Architecture native to NestJS.

### 3-Tier Layer Structure

1. **Controllers:** HTTP routing, DTO validation — thin.
2. **Services:** Business logic, transactions, external API calls.
3. **Data Access:** Prisma client — queries, integrity, cascades.

### Cross-cutting bootstrap

HTTP middleware and global pipes live in `src/bootstrap/configure-http-app.ts` (used by `main.ts` and E2E factory):

- `helmet` security headers
- CORS from `CORS_ORIGINS`
- Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`)
- `HttpExceptionFilter` (unified error envelope)
- `TraceInterceptor` (`x-request-id`)
- `ResponseInterceptor` (`{ data }` wrapper)
- Swagger at `/v1/docs` (disabled in test env)

---

## 4. Folder Structure

```text
src/
├── main.ts
├── app.module.ts
├── bootstrap/
│   ├── configure-http-app.ts    # Helmet, CORS, pipes, interceptors
│   └── swagger.ts
├── core/
│   ├── config/                  # configuration.ts, env.validation.ts
│   ├── database/                # PrismaModule
│   ├── queue/                   # AppBullModule (shared BullMQ forRoot)
│   ├── security/                # AppThrottlerModule (Redis-backed)
│   └── logger/
├── shared/
│   ├── controllers/             # health, app/config
│   ├── decorators/              # @CurrentUser, @Public, @SanitizeText, @ThrottleAuth
│   ├── filters/                 # HttpExceptionFilter
│   ├── guards/                  # JwtAuthGuard, RolesGuard, RateLimitGuard
│   ├── interceptors/            # ResponseInterceptor, TraceInterceptor
│   ├── validators/              # exclusive-target (ADR-007)
│   └── utils/                   # cursor-pagination
└── modules/
    ├── auth/
    ├── users/
    ├── explore/                 # cities, monuments, categories, search
    ├── feedback/                # favorites, ratings, reports
    ├── interactions/            # batch telemetry → BullMQ
    ├── notifications/
    ├── personality/
    ├── recommendations/         # home feed, snapshot refresh, AI client
    └── ai-chat/                 # session/message CRUD + proxy

test/
├── helpers/e2e-app.factory.ts
├── app.e2e-spec.ts
├── auth.e2e-spec.ts
├── explore.e2e-spec.ts
├── feedback.e2e-spec.ts
├── quiz.e2e-spec.ts
├── home.e2e-spec.ts
└── hardening.e2e-spec.ts

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

---

## 5. Development Workflow (Stages vs Phases)

`BACKEND_WORKFLOW.md` uses coarse **stages**. [doc/phases/](doc/phases/) breaks them into finer build steps.

| Stage | Scope | Phases | Status |
|---|---|---|---|
| **0 — Living docs** | API contract, ADRs, Postman | Ongoing | ✅ baseline |
| **1 — Infrastructure & DB** | NestJS, Docker PG/Redis, Prisma, seed | 0, 1 | ✅ |
| **2 — Auth & security** | JWT RTR, guards, hardening | 2, 7 | ✅ |
| **3 — Core content API** | Explore, search, personality quiz | 3, 5 | ✅ |
| **4 — AI integrations** | Home feed, chat proxy, snapshots, telemetry | 4 (partial), 6 | ✅ stub mode |
| **5 — Feedback & notifications** | Favorites, ratings, reports, inbox | 4 | ✅ |
| **6 — QA & deploy** | E2E, CI/CD, prod ops | 7 (partial), 8, 9 | 🔜 8–9 |

### Stage 1 — Infrastructure & Database ✅

- NestJS + TypeScript + ESLint + Prettier.
- `docker-compose.yml` — PostgreSQL 16 & Redis 7.
- Prisma schema + migrations + seed (`Egypt-Tourism-landmarks.json`).
- ADR-007 CHECK constraints in migration SQL.

### Stage 2 — Authentication & Base Security ✅

- JWT access + rotating refresh tokens (RTR) with family reuse detection.
- `class-validator` DTOs, unified error envelope.
- Global JWT guard; `@Public()` on bootstrap/auth routes.
- OAuth 2.0 (Google, Facebook, Apple) — **deferred** (`501` on `/v1/auth/social`).

### Stage 3 — Core Content API ✅

- Cities, categories, **monuments** (`/monuments`), search.
- Sub-resources: awareness, timeline, media.
- Cursor pagination (`?cursor=&limit=`).
- Panorama metadata endpoint — **not implemented** (frontend-only).

### Stage 4 — AI Service Integrations ✅ (stub-first)

- `AiServiceClient` interface with **stub** (default) and **HTTP** implementations.
- `GET /v1/home` — reads `RecommendationSnapshot` only; never blocks on FastAPI.
- BullMQ `recommendations-refresh` worker; triggers on favorite add + quiz submit.
- Chat: `POST /v1/chat/sessions/:id/messages` proxies to FastAPI with timeout fallback.
- Interaction batch: `POST /v1/interactions/batch` → BullMQ → `USER_INTERACTION`.

Env: `AI_SERVICE_USE_STUB=true` (default), `AI_SERVICE_URL`, `AI_SERVICE_API_KEY`, `AI_SERVICE_TIMEOUT_MS`.

### Stage 5 — Feedback & Notifications ✅

- Ratings (upsert), reports (3/day throttle), favorites (ADR-007 XOR `cityId`/`monumentId`).
- Notification inbox (list, mark read, mark all read).
- BullMQ queues: `interactions-ingest`, `recommendations-refresh`.

### Stage 6 — Production QA & Optimization 🔜

- Index tuning, expanded E2E, Postman/Newman regression (Phase 8).
- CI/CD deploy, monitoring (Phase 9).

---

## 6. API & System Design Focus

NFR-3 (100ms UI) and NFR-2 (1.5–3s AI budget).

**Key principles:**

- **Unified Error Envelope** — global `HttpExceptionFilter`; validation returns `VALIDATION_ERROR` with field `details`.
- **Unified Success Envelope** — `{ data }` via `ResponseInterceptor`; lists add `cursor` + `has_next`.
- **Referential integrity (ADR-007):** exclusive nullable FKs (`city_id` / `monument_id` + CHECK) on favorites, ratings, reports — not generic polymorphic pairs on content tables. Telemetry uses `entity_type` + `entity_id` on `USER_INTERACTION` only.
- **Latency:** recommendations computed async; reads from `RecommendationSnapshot` target &lt; 50ms.
- **Interaction buffering:** `POST /v1/interactions/batch` → BullMQ → bulk PostgreSQL writes (202 Accepted).
- **RTR security:** refresh token reuse invalidates entire token family.

**Request/response naming:**

- Content **responses:** snake_case (`name_en`, `city_id`).
- Feedback **request bodies:** camelCase (`cityId`, `monumentId`).

---

## 7. State & Cache Strategy

| Layer | Tool | Purpose |
|---|---|---|
| Transactional | PostgreSQL | Users, monuments, chat, reports, snapshots |
| Volatile | Redis | BullMQ queues, distributed rate-limit counters |
| AI cache | JSONB in PostgreSQL | `RecommendationSnapshot.recommendations` |

In test/E2E (`NODE_ENV=test` or `E2E_TEST=true`): Bull workers and Redis throttler storage are disabled; in-memory fallbacks apply.

---

## 8. Routing & Endpoint Strategy

```
/v1
├── /health                    # Public — ops only
├── /docs                      # Swagger UI (non-test env)
├── /app/config                # Public — mobile bootstrap
├── /auth                      # register, login, refresh, logout (+ social 501)
├── /me                        # profile
├── /me/personality
├── /me/favorites
├── /me/reports
├── /cities
├── /monuments                 # list, detail, awareness, timeline, media
├── /categories
├── /search                    # + /search/suggestions
├── /home                      # For You + featured (snapshot or fallback)
├── /personality/quiz
├── /chat/sessions             # list, create, messages
├── /ratings
├── /reports
├── /favorites
├── /interactions/batch        # telemetry (202)
└── /notifications
```

- **Localization:** detail returns both `name_en` / `name_ar`.
- **Pagination:** `?cursor=&limit=` (opaque base64 cursors).
- **Guest mode (future):** [guest-mode-route-matrix.md](doc/guest-mode-route-matrix.md)

Full route table: [doc/api-endpoint-contract.md](doc/api-endpoint-contract.md).

---

## 9. Security & Hardening (Phase 7)

| Control | Implementation |
|---|---|
| Input validation | Global `ValidationPipe` — `whitelist`, `forbidNonWhitelisted`, `transform` |
| Rate limiting | `@nestjs/throttler` + Redis; default 60/min; auth 10/min via `@ThrottleAuth()` |
| Security headers | `helmet` — `X-Frame-Options`, `Content-Security-Policy`, etc. |
| CORS | `CORS_ORIGINS` env (comma-separated) |
| Request tracing | `TraceInterceptor` — generates/echoes `x-request-id` in logs |
| Text sanitization | `@SanitizeText()` on chat messages, reports, search queries, display name |
| Password hashing | bcrypt |
| Auth | Global JWT guard; `@Public()` opt-out |

Health and app config routes use `@SkipThrottle()`.

Env: `CORS_ORIGINS`, `THROTTLE_DEFAULT_*`, `THROTTLE_AUTH_*`.

---

## 10. Testing Strategy

| Tool | Purpose | Location |
|---|---|---|
| **Jest** | Unit tests — services, scoring, validators, sanitization | `src/**/*.spec.ts` |
| **Supertest** | E2E — HTTP status, envelopes, guards, hardening | `test/*.e2e-spec.ts` |

```bash
npm run test        # unit
npm run test:e2e    # E2E (skips DB-dependent cases if migrations unavailable)
npm run build       # compile check
```

**Current E2E coverage:** health/config, auth lifecycle, explore, feedback, quiz, home/chat (stub), hardening (validation 400, throttle 429, Swagger, Helmet, tracing).

**Phase 8 goals:** transaction-isolated integration tests, Newman/Postman regression, broader route coverage.

Co-locate `*.spec.ts` next to source. Mock external FastAPI in tests via `AI_SERVICE_USE_STUB=true` (default).

---

## 11. Best Practices

### Clean Code

- Explicit typing; avoid `any`.
- DTO validation on all inputs; reject unknown fields.
- Services own Prisma access — keep controllers thin.

### Scalability

- Long-running work → BullMQ (interactions ingest, recommendation refresh).
- Index `user_interaction` on `(user_id, created_at)`.
- Home feed never calls FastAPI synchronously.

### Security

- Rotate `JWT_ACCESS_SECRET` in production.
- Tighten `CORS_ORIGINS` per environment.
- Set `AI_SERVICE_USE_STUB=false` only when FastAPI is deployed and keyed.

---

## 12. Out of Scope (MVP)

- Mobile gamification APIs (leaderboards, XP, badges, challenges)
- Gamified `/quizzes/*` content endpoints
- Admin dashboards
- Guest mode (interim auth wall — see guest-mode-route-matrix)
- Backend panorama metadata route (frontend handles 360° assets)
- OAuth social login, password reset (contract placeholders)

**Gamification showcase website:** separate teammate project for supervisors — prototype only.

---

## 13. Next Steps

1. **Phase 8** — expand E2E and integration coverage; Postman/Newman regression suite.
2. **Phase 9** — production Docker image, CI/CD pipeline, monitoring/alerting.
3. **FastAPI integration** — flip `AI_SERVICE_USE_STUB=false` when the Python service publishes its OpenAPI contract.
4. **Deferred auth** — social OAuth, password reset, settings, push-token registration.
