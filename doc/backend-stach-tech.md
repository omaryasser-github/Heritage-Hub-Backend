> **ORM:** Prisma selected — see [ADR-002](../adr/ADR-002-prisma-orm.md). NestJS stack ADR: [backend-stack-tech.md](../backend-stach-tech.md) (ADR-001).

## Context & MVP Scope

Heritage Hub is a React Native (Expo) app \~80% complete on the frontend. This decision selects the backend stack for MVP phase 1.

**In scope:** auth, cities/monuments CRUD + filters, ratings (upsert), reports, notifications, recommendations proxy (HTTP call to a separate FastAPI AI service — Pattern A), personality onboarding quiz, and interaction telemetry.

**Out of scope (MVP backend):** mobile gamification (leaderboards, achievements/badges, challenges, learning paths), gamified content quizzes, guest mode (planned post-core), admin dashboards.

**Gamification showcase website:** A separate teammate project demonstrates gamification UX for supervisors using mock/demo data — **not** the Heritage Hub production API. See [ADR-003](../doc/adr/ADR-003-mvp-scope.md).

**Architecture note (Pattern A):** The AI team runs its own FastAPI/Python service. Our backend calls it over HTTP. Therefore AI/LLM fit is intentionally a low-weight criterion.

## Section 1 — Criteria & Weights

Weights are on a 1–20 scale and sum to 100, so weighted totals read directly as percentages.

| # | Criterion | Weight | Scoring lens |
| --- | --- | --- | --- |
| 1 | Familiarity / learning curve | 20 | Ramp-up speed from a TS/JS baseline + skill transferability (developer is strong in TS/JS and willing to learn the winner) |
| 2 | Development speed | 18 | Time-to-MVP for the in-scope feature set |
| 3 | Ecosystem maturity | 14 | Libraries, ORMs, auth, community support |
| 4 | Frontend integration | 12 | Fit with React Native/Expo: TS types, codegen, shared schemas |
| 5 | ORM / relational fit | 12 | Suits a heavily relational ER (24+ entities, polymorphic FKs) |
| 6 | Hosting cost | 10 | Cheapest realistic path to deploy and run |
| 7 | Performance | 8 | Throughput/latency under normal load |
| 8 | AI/LLM fit | 6 | Low weight by design — Pattern A keeps AI in a separate service |

## Section 2 — Scoring Matrix (raw scores, 0–10)

Each cell is the raw quality score for that stack on that criterion. Weighted totals are computed separately below using (Score/10) × Weight.

| Criterion (Weight) | NestJS | Express | Django | FastAPI | Laravel | Go |
| --- | --- | --- | --- | --- | --- | --- |
| Familiarity (20) | 9 | 10 | 6 | 7 | 4 | 5 |
| Dev Speed (18) | 8 | 7 | 9 | 8 | 9 | 5 |
| Ecosystem (14) | 8 | 9 | 9 | 7 | 8 | 8 |
| Frontend Integration (12) | 10 | 9 | 6 | 7 | 5 | 6 |
| ORM/Relational Fit (12) | 9 | 7 | 10 | 8 | 9 | 6 |
| Hosting Cost (10) | 7 | 8 | 7 | 8 | 7 | 10 |
| Performance (8) | 7 | 6 | 6 | 8 | 5 | 10 |
| AI/LLM Fit (6) | 6 | 6 | 9 | 10 | 5 | 6 |

### Weighted totals

Formula: total = Σ (Score/10) × Weight. Since weights sum to 100, the total is already a percentage.

| Stack | Weighted total |
| --- | --- |
| NestJS | 82.6% |
| Express.js | 80.8% |
| Django | 77.2% |
| FastAPI | 76.6% |
| Laravel | 66.2% |
| Go | 66.2% |

**Justification highlights:**

- NestJS: best frontend integration (first-class TS, shared types), strong DI/module structure for a 24-entity domain, solid ORM (Prisma selected — ADR-002). Slightly steeper learning curve than Express but transfers TS skill directly.
    
- Express: highest familiarity for a TS/JS dev, huge ecosystem, but unopinionated — more boilerplate and weaker structure for a large relational domain.
    
- Django: excellent dev speed + ORM/admin for relational data, but Python (lower transfer from TS) and weaker RN type-sharing story.
    
- FastAPI: great performance + best AI/LLM affinity, but that affinity is low-weight under Pattern A; Python lowers familiarity/frontend transfer.
    
- Laravel: strong dev speed + ORM (Eloquent), but PHP is the weakest skill transfer and frontend type-sharing is poor.
    
- Go: best performance + hosting cost, but slowest to MVP and weakest ORM/relational ergonomics for this scope.
    

## Section 3 — Ranking & Tie-breaker

Ranking by weighted total:

1. NestJS — 82.6%
    
2. Express.js — 80.8%
    
3. Django — 77.2%
    
4. FastAPI — 76.6%
    
5. Laravel — 66.2%
    
6. Go — 66.2%
    

**Tie-breaker rule:** within \~5% → most familiar → then cheapest to host.

- NestJS (82.6) vs Express (80.8): gap 1.8% is within the band. Pure familiarity tie-breaker favors Express. However, weighing the developer's explicit intent to learn the winning stack for long-term experience, plus NestJS's stronger architecture for a large relational domain and superior TS/RN type-sharing, the recommendation is NestJS with Express as documented fallback.
    
- Django (77.2) vs FastAPI (76.6): within band; Python runner-up cluster, behind both TS leaders.
    
- Laravel vs Go (66.2 tie): familiarity tie-breaker slightly favors Go; not decision-relevant.
    

## Section 4 — ADR

**ADR-001: Backend stack for Heritage Hub MVP**

- **Status:** Accepted
    
- **Date:** 2026-06-04
    
- **Decision:** Adopt **NestJS (TypeScript)** as the backend framework for the MVP.
    
- **Context:** Frontend is React Native/Expo (TypeScript). MVP scope is auth, CRUD with filters, ratings, reports, notifications, a recommendations proxy to a separate FastAPI AI service (Pattern A), and a personality onboarding quiz. The ER model is heavily relational (24+ entities, polymorphic FKs). A weighted decision matrix across 8 criteria was used; formula (Score/10) × Weight with weights summing to 100.
    
- **Rationale:** NestJS scored highest (82.6%). It maximizes TS skill transfer and end-to-end type sharing with the RN client, provides opinionated structure (modules/DI) well-suited to a large relational domain, and integrates cleanly with **Prisma** (ADR-002).
    
- **Consequences:** Team commits to NestJS + **Prisma**. Monuments API at `/monuments` (ADR-004). Recommendations via HTTP client to external FastAPI. Gamification deferred; showcase website is prototype only. Guest mode planned after core auth/content.
