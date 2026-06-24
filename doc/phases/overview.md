# Implementation Phases — Overview

Step-by-step backend delivery index. Maps phases to ADRs, workflow stages, and key endpoints.

> **Authority:** When docs conflict, [ADR index](../adr/README.md) wins.

---

## Phase map

| Phase | Title | Workflow stage | Key deliverables |
|---|---|---|---|
| [0](./phase-0-setup.md) | Foundation & setup | Stage 0–1 | `/v1/health`, `/v1/app/config`, error envelope, Prisma wire-up |
| [1](./phase-1-data-layer.md) | Data layer & migrations | Stage 1 | Prisma schema, seeds, ADR-007 CHECK constraints |
| [2](./phase-2-auth.md) | Auth & identity | Stage 2 | Register, login, refresh RTR, `/me` |
| [3](./phase-3-core-domain.md) | Core domain CRUD | Stage 3 | Cities, monuments, panorama, search |
| [4](./phase-4-user-interactions.md) | Ratings, reports, notifications | Stage 5 (partial) | Favorites, ratings, reports, notifications |
| [5](./phase-5-personality-quiz.md) | Personality quiz | Stage 3–4 | Static onboarding quiz |
| [6](./phase-6-recommendations-proxy.md) | AI proxy & home feed | Stage 4 | FastAPI client, `/home`, chat proxy |
| [7](./phase-7-hardening.md) | Hardening | Stage 6 (partial) | Throttler, Helmet, Swagger `/v1/docs` |
| [8](./phase-8-testing.md) | Testing & QA | Stage 6 | Jest unit + Supertest E2E |
| [9](./phase-9-deployment.md) | Deployment & ops | Stage 6 | Docker, CI/CD, monitoring |

---

## ADR cross-reference

| ADR | Impacts phases |
|---|---|
| [ADR-002 Prisma](../adr/ADR-002-prisma-orm.md) | 0, 1 |
| [ADR-003 MVP scope](../adr/ADR-003-mvp-scope.md) | All — gamification out, guest deferred |
| [ADR-004 Monument naming](../adr/ADR-004-monument-api-naming.md) | 1, 3, 4 |
| [ADR-007 Polymorphic FKs](../adr/ADR-007-polymorphic-associations.md) | 1, 4 |

---

## Plans (not phases)

| Plan | Phase hint |
|---|---|
| [Interaction telemetry](../plans/interaction-telemetry.md) | 4 or early 6 |
| [Guest mode route matrix](../guest-mode-route-matrix.md) | Post-MVP |

---

## OUT OF SCOPE (MVP)

See [ADR-003](../adr/ADR-003-mvp-scope.md):

- Mobile gamification (leaderboards, XP, badges, challenges)
- Gamification showcase website is a **separate prototype** — not production API
- Gamified `/quizzes/*` endpoints
- Guest mode (interim: auth everywhere except `/app/config` + `/auth/*`)
- Admin dashboards

---

## Workflow stages vs phases

`BACKEND_WORKFLOW.md` uses 6 coarse stages. Phases 0–9 are finer-grained build steps within those stages. Use this overview to navigate; use individual phase files for acceptance criteria.

| Workflow stage | Phases |
|---|---|
| Stage 0 — Living docs | Ongoing |
| Stage 1 — Infrastructure & DB | 0, 1 |
| Stage 2 — Auth & security | 2, 7 (partial) |
| Stage 3 — Core content API | 3, 5 |
| Stage 4 — AI integrations | 6 |
| Stage 5 — Feedback & notifications | 4 |
| Stage 6 — QA & deploy | 7, 8, 9 |

---

## Full vision backlog

`planing/req-analysis/` contains the **complete product vision** (user stories, ERD, seed JSON). Not every story is MVP — see ADR-003.
