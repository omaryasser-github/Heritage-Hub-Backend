# Heritage Hub — Backend Development Workflow

> **Platform:** Node.js (NestJS Framework)  
> **Language:** TypeScript  
> **Database:** PostgreSQL with **Prisma** (ADR-002)  
> **AI Integration (Pattern A):** External Python (FastAPI) HTTP client proxy  
> **Localization:** Bilingual (Arabic / English) payload support  
> **Docs:** [ADR index](doc/adr/README.md) · [Phases](doc/phases/overview.md) · [API contract](doc/api-endpoint-contract.md)

---

## 1. Backend Overview

The Heritage Hub backend is a **modular REST API** built with NestJS and TypeScript. It serves as the single source of truth and primary gateway for the React Native (Expo) mobile client.

The backend is responsible for:
- Implementing secure user authentication (OAuth 2.0 social log-ins & database-backed Refresh Token Rotation).
- Providing read APIs and filtering for cities, **monuments**, categories, and timelines.
- Serving 360° panorama metadata and coordinate-based hotspots.
- Proxying and caching requests to the separate Python FastAPI service (chatbot, recommendation snapshots).
- Processing, buffering, and logging high-frequency user interactions for AI signals ([interaction-telemetry plan](doc/plans/interaction-telemetry.md)).
- Dispatching push notifications to iOS and Android devices.

**MVP scope** (ADR-003): personality quiz, recommendations proxy, core content — **not** mobile gamification. Gamification vision is demonstrated via a **separate showcase website** (supervisor prototype; mock data; not production API). **Guest mode** is planned after core architecture; interim rule: Bearer required on content routes; public: `GET /v1/app/config` and `/v1/auth/*` (see [API contract](doc/api-endpoint-contract.md)).

---

## 2. Architecture Approach

Modular / Domain-Driven Architecture native to NestJS.

### 3-Tier Layer Structure
1. **Controllers:** HTTP routing, DTO validation — thin.
2. **Services:** Business logic, transactions, external API calls.
3. **Data Access:** Prisma client — queries, integrity, cascades.

---

## 3. Folder Structure (High-Level)

```
src/
├── main.ts
├── app.module.ts
├── core/
│   ├── config/
│   ├── database/          # Prisma module
│   ├── security/
│   └── logger/
├── shared/
│   ├── decorators/        # @CurrentUser, @Public
│   ├── dtos/
│   ├── filters/           # Unified Error Envelope
│   ├── guards/
│   └── interceptors/
└── modules/
    ├── auth/
    ├── users/
    ├── explore/           # Cities, Monuments, Panoramas
    ├── personality/
    ├── ai-chat/
    ├── recommendations/
    ├── interactions/      # Telemetry batch intake
    ├── notifications/
    └── feedback/          # Ratings, reports
```

---

## 4. Development Workflow

### Stage 0 — Living Documentation
- Keep `doc/api-endpoint-contract.md` and ADRs updated.
- Postman/Insomnia profiles per environment.

### Stage 1 — Infrastructure & Database
- NestJS + TypeScript + ESLint + Prettier.
- Docker PostgreSQL & Redis.
- **Prisma** schema + migrations + seed (`Egypt-Tourism-landmarks.json`).
- ADR-007 CHECK constraints in migration SQL.

### Stage 2 — Authentication & Base Security
- JWT access + rotating refresh tokens (RTR).
- `class-validator` DTOs, unified error envelope.
- OAuth 2.0 (Google, Facebook, Apple).

### Stage 3 — Core Content API
- Cities, categories, **monuments** (`/monuments`), search, panorama metadata.
- Cursor pagination.
- Image/asset pipeline (WebP/AVIF tiers) as needed.

### Stage 4 — AI Service Integrations
- `HttpModule` proxy to FastAPI.
- Chatbot (sync REST for MVP; streaming deferred).
- Recommendation background worker → `RecommendationSnapshot`.
- Interaction batch intake → Redis → BullMQ → `USER_INTERACTION`.

### Stage 5 — Feedback & Notifications
- Ratings (upsert), reports, favorites.
- Push token registration; notification inbox.
- BullMQ for email, interaction batches, notification jobs.

### Stage 6 — Production QA & Optimization
- Index tuning, E2E tests (auth, quiz, chat, monuments).
- CI/CD deploy.

> Fine-grained steps: [doc/phases/overview.md](doc/phases/overview.md)

---

## 5. API & System Design Focus

NFR-3 (100ms UI) and NFR-2 (1.5–3s AI budget).

**Key principles:**

- **Unified Error Envelope** — global exception filter.
- **Referential integrity (ADR-007):** exclusive nullable FKs (`city_id` / `monument_id` + CHECK) — not generic `entity_type` + `entity_id` on content tables.
- **Latency:** recommendations computed async; reads from `RECOMMENDATION_SNAPSHOT` &lt; 50ms.
- **Interaction buffering:** `POST /v1/interactions/batch` → BullMQ → bulk PostgreSQL writes.
- **RTR security:** refresh token reuse invalidates entire token family.

---

## 6. State & Cache Strategy

| Layer | Tool | Purpose |
|---|---|---|
| Transactional | PostgreSQL | Users, monuments, chat, reports |
| Volatile | Redis | Rate limits, queues, interaction buffer |
| AI cache | JSONB snapshots | `RECOMMENDATION_SNAPSHOT` |

---

## 7. Routing & Endpoint Strategy

```
/v1
├── /auth
├── /app/config
├── /me
├── /cities
├── /monuments       → list, detail, awareness, timeline, media, panorama
├── /home
├── /categories
├── /search
├── /personality
├── /chat
├── /ratings
├── /reports
├── /favorites
├── /interactions    → batch telemetry
├── /devices         → push-token
└── /notifications
```

- **Localization:** `Accept-Language` on lists; detail returns both `name_en` / `name_ar`.
- **Pagination:** `?cursor=&limit=` (opaque base64 cursors).
- **Guest mode (future):** [guest-mode-route-matrix.md](doc/guest-mode-route-matrix.md)

---

## 8. Best Practices

### Clean Code
- Explicit typing; no `any`.
- DTO validation on all inputs.
- Services use Prisma — keep query logic in repositories/services.

### Scalability
- Long-running work → BullMQ (interactions, emails, AI refresh).
- Index `user_interaction` on `(user_id, created_at)`.

### Security
- `argon2id` or `bcrypt` for passwords.
- Strict CORS; `@nestjs/throttler` + Redis on auth and interaction endpoints.

---

## 9. Testing Strategy (MVP-Level)

| Tool | Purpose |
|---|---|
| **Jest** | Unit tests (services, scoring, validators) |
| **Supertest** | E2E — auth, monuments, quiz, error envelope |

Co-locate `*.spec.ts` next to source. `npm run test` / `npm run test:e2e`.

---

## 10. Out of Scope (MVP)

- Mobile gamification APIs (leaderboards, XP, badges, challenges)
- Gamified `/quizzes/*` content endpoints
- Admin dashboards
- Guest mode (interim auth wall — see guest-mode-route-matrix)

**Gamification showcase website:** separate teammate project for supervisors — prototype only.
