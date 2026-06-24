# ADR-003: MVP Scope, Guest Mode Deferral & Gamification Showcase

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Heritage Hub backend team

## Context

`planing/req-analysis/` captures the **full product vision** (guest browsing, gamification, contextual quizzes, leaderboards). The backend must ship a lean MVP without building every feature at once. A teammate is building a **separate gamification showcase website** at supervisor request.

## Decision

### In scope (MVP backend)

- Auth (register, login, social, refresh rotation, password reset)
- Cities, monuments, categories, search, home aggregation
- Panorama metadata + hotspots
- Favorites, ratings, reports
- Personality onboarding quiz (static)
- Recommendations proxy (Pattern A — FastAPI HTTP client + `RecommendationSnapshot` cache)
- Chatbot (sync REST proxy)
- Notifications (in-app feed + push token registration)
- User interaction telemetry (see [interaction-telemetry.md](../plans/interaction-telemetry.md))

### Out of scope (MVP backend — do NOT build)

- Mobile gamification: leaderboards, achievements/badges, XP/coins, challenges, learning paths
- Gamified content quizzes (`/monuments/:id/quizzes`, `/quizzes/:id/attempts`)
- Admin dashboards (content mgmt, moderation, analytics)
- Gamification database tables beyond stubs (see Phase 1 notes)

### Deferred — confirmed for later

- **Guest mode** — will be implemented after backend architecture and core routes are stable, then frontend UI/login wall. See [guest-mode-route-matrix.md](../guest-mode-route-matrix.md).
- **Interim auth rule until guest mode ships:** all endpoints require auth **except** `GET /app/config` and `/auth/*`.

### Gamification showcase website (prototype — NOT production API)

A separate **gamification showcase website** demonstrates the full gamification vision (XP, badges, leaderboards, challenges) for supervisors and stakeholders.

| Aspect | Rule |
|---|---|
| Purpose | Vision demo / design prototype |
| Data | Mock data or thin demo API — **not** the Heritage Hub production backend |
| Backend impact | **No** gamification APIs required for MVP because of this site |
| Mobile app | Gamification `features/` folder in RN remains **deferred** until post-MVP |
| Expectation | Supervisors must understand: website = prototype, mobile + backend MVP = core product |

## Rationale

- Keeps backend team focused on auth, content, AI proxy, and telemetry
- Satisfies supervisor visibility via the showcase website without scope creep
- Guest mode deferred avoids half-built auth walls blocking core API development
- Full vision remains in `planing/req-analysis/` as backlog, not MVP contract

## Consequences

- `planing/req-analysis/User_Stories.md` is **full vision backlog** — not all stories are MVP
- `doc/api-endpoint-contract.md` is the **MVP API contract**
- Gamified quiz endpoints are listed under **Deferred** in the contract, not Implemented
- When guest mode ships, update contract + guest-mode-route-matrix + `@Public()` decorators together

## References

- [guest-mode-route-matrix.md](../guest-mode-route-matrix.md)
- [project-features-arch.md](../project-features-arch.md)
- `planing/req-analysis/User_Stories.md` (full vision)
