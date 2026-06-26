# Heritage Hub Backend

A modular REST API built with NestJS and TypeScript. It is the primary gateway for the Heritage Hub mobile client: user sessions, bilingual content, interaction telemetry, and an async recommendations pipeline that proxies to an external Python FastAPI service.

## Implementation status

Phases **0–7** are implemented in this repository. Phases **8–9** (expanded QA and deployment) are next.

| Phase | Scope | Status |
|---|---|---|
| 0 | Health, app config, error envelope, Prisma wire-up | Done |
| 1 | Schema, migrations, seed, ADR-007 CHECK constraints | Done |
| 2 | Register, login, refresh RTR, `/me` | Done |
| 3 | Cities, monuments, categories, search | Done |
| 4 | Favorites, ratings, reports, notifications, interaction batch | Done |
| 5 | Personality quiz (static 7-question onboarding) | Done |
| 6 | `GET /v1/home`, AI chat proxy, recommendation snapshots (stub-first) | Done |
| 7 | Helmet, CORS, Redis throttler, tracing, sanitization, Swagger | Done |
| 8 | Expanded test coverage, Postman/Newman regression | Planned |
| 9 | Production deploy, CI/CD, monitoring | Planned |

**Intentionally not in backend MVP**

- `GET /v1/monuments/:id/panorama` — panorama is handled on the **frontend** (no backend route).
- OAuth social login, password reset, `/me/settings`, `/devices/push-token` — contract placeholders; not implemented yet.

Details: [implementation phases](doc/phases/overview.md) · [API contract](doc/api-endpoint-contract.md) · [ADR-003 MVP scope](doc/adr/ADR-003-mvp-scope.md).

---

## Installation

```bash
git clone https://github.com/omaryasser-github/Heritage-Hub-Backend.git
cd Heritage-Hub-Backend
npm install
cp .env.example .env
```

## Local development

Start PostgreSQL and Redis, apply migrations, seed content, then run the API:

```bash
docker-compose up -d
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

| URL | Purpose |
|---|---|
| `http://localhost:3000/v1/health` | Ops health check |
| `http://localhost:3000/v1/app/config` | Mobile bootstrap (feature flags) |
| `http://localhost:3000/v1/docs` | Swagger UI (OpenAPI) |

Production: `npm run build` then `npm run start:prod`.

### Environment highlights

Copy `.env.example` and adjust as needed. Key groups:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | BullMQ queues + distributed rate limiting |
| `JWT_ACCESS_SECRET` | Access token signing |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `THROTTLE_*` | Default (60/min) and auth (10/min) rate limits |
| `AI_SERVICE_USE_STUB` | `true` (default) — full local dev without FastAPI |
| `AI_SERVICE_URL` / `AI_SERVICE_API_KEY` | Real FastAPI when stub is disabled |

With `AI_SERVICE_USE_STUB=true`, home recommendations and chat use in-process stub clients. Flip to `false` when the Python service is deployed.

---

## Features

- **Domain-driven modules** — auth, explore, feedback, interactions, personality, recommendations, ai-chat, notifications.
- **Refresh Token Rotation (RTR)** — DB-backed families with reuse detection.
- **Async recommendations** — BullMQ refresh jobs write `RecommendationSnapshot`; `GET /v1/home` reads PostgreSQL only (sub-50ms target).
- **Interaction telemetry** — `POST /v1/interactions/batch` → Redis/BullMQ → PostgreSQL for AI signals.
- **Personality quiz** — static onboarding quiz with four persona types; triggers recommendation refresh on submit.
- **AI chat proxy** — session/message CRUD with FastAPI proxy (stub fallback on timeout/error).
- **Bilingual payloads** — `name_en` / `name_ar` on content responses.
- **Unified envelopes** — `{ data }` success; `{ error: { code, message, details } }` on failure.
- **Hardening** — strict DTO validation, Helmet headers, CORS, Redis throttler, `x-request-id` tracing, HTML sanitization on user text fields.

---

## Tech stack

| Layer | Tools |
|---|---|
| Runtime | Node.js ≥ 20.19, NestJS 11, TypeScript |
| Database | PostgreSQL 16, Prisma ORM ([ADR-002](doc/adr/ADR-002-prisma-orm.md)) |
| Queues / cache | Redis 7, BullMQ, `@nestjs/throttler` |
| Auth | JWT access + rotating refresh tokens, bcrypt |
| Validation | class-validator, class-transformer |
| Docs | `@nestjs/swagger` at `/v1/docs` |
| Testing | Jest (unit), Supertest (E2E) |

---

## Scripts

```bash
npm run start:dev      # watch mode
npm run build          # compile to dist/
npm run test           # unit tests (*.spec.ts under src/)
npm run test:e2e       # E2E tests (test/*.e2e-spec.ts)
npm run db:migrate     # prisma migrate dev
npm run db:seed        # seed cities, categories, monuments
npm run db:reset       # migrate reset + seed
```

E2E suites skip gracefully when `DATABASE_URL` is unset or migrations are not applied.

---

## Project layout

```text
src/
├── main.ts
├── bootstrap/              # HTTP setup (Helmet, CORS, Swagger, pipes)
├── core/
│   ├── config/
│   ├── database/           # Prisma
│   ├── queue/              # Shared BullMQ forRoot
│   ├── security/           # Throttler module
│   └── logger/
├── shared/                 # Guards, filters, interceptors, decorators
└── modules/
    ├── auth/
    ├── users/
    ├── explore/
    ├── feedback/
    ├── interactions/
    ├── notifications/
    ├── personality/
    ├── recommendations/
    └── ai-chat/

test/                       # Supertest E2E specs
doc/                        # API contract, ADRs, phase guides
prisma/                     # Schema, migrations, seed
```

---

## Contributing

Before contributing, review:

- [BACKEND_WORKFLOW.md](BACKEND_WORKFLOW.md) — architecture, conventions, and workflow
- [API contract](doc/api-endpoint-contract.md) — MVP routes and payloads
- [Documentation index](doc/README.md) — all project docs
- [ADR index](doc/adr/README.md) — locked decisions (MVP scope, monuments, polymorphic FKs)
- [Implementation phases](doc/phases/overview.md) — step-by-step roadmap

Full product vision (not all MVP): `planing/req-analysis/` — see [ADR-003](doc/adr/ADR-003-mvp-scope.md).

---

## License

MIT License — see `LICENSE`.

## Credits

Developed for the **Heritage Hub Platform** to bridge ancient Egyptian history with modern immersive technologies.
