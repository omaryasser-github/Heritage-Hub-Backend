# Phase 3: Core Domain CRUD (Monuments, Cities, Timeline)

## Objective
Implement paginated query endpoints for Cities, Categories, Monuments, Search, and Timelines per ADR-004 (`/monuments`).

## Scope
*   **In Scope:**
    *   `GET /v1/cities`, `GET /v1/cities/:cityId`
    *   `GET /v1/monuments` — filters: `kind`, `category`, `city_id`, `cursor`, `limit`
    *   `GET /v1/monuments/:monumentId` and sub-resources: `/awareness`, `/timeline`, `/media`, `/panorama`
    *   `GET /v1/categories`, `GET /v1/search`, `GET /v1/search/suggestions`
    *   Cursor-based pagination on all list routes.
*   **Out Scope:**
    *   Favorites, ratings, reports (Phase 4).

## Dependencies / Entry Criteria
- Phase 2 complete.
- Seed data loaded.
- ADR-004 monument naming agreed with frontend.

## Folder Structure
```text
src/modules/explore/
├── explore.module.ts
├── controllers/
│   ├── cities.controller.ts
│   └── monuments.controller.ts
├── services/
│   ├── cities.service.ts
│   └── monuments.service.ts
└── dto/
    ├── monuments-query.dto.ts
    └── pagination.dto.ts
```

## Endpoints & Entities Touched
- **Endpoints (Protected — interim until guest mode):**
  - `GET /v1/cities`
  - `GET /v1/cities/:cityId`
  - `GET /v1/monuments`
  - `GET /v1/monuments/:monumentId`
  - `GET /v1/monuments/:monumentId/media`
  - `GET /v1/monuments/:monumentId/timeline`
  - `GET /v1/monuments/:monumentId/panorama`
  - `GET /v1/categories`
  - `GET /v1/search`
  - `GET /v1/search/suggestions`
- **Entities:** `City`, `Monument`, `Category`, `Panorama`, `Hotspot`, `MediaAsset`, `TimelineEvent`

> When guest mode ships, these content routes move to `@Public()` per [guest-mode-route-matrix.md](../guest-mode-route-matrix.md).

## Acceptance Criteria
- [ ] Opaque base64 cursor pagination works.
- [ ] `GET /v1/monuments?city_id=<id>` filters correctly.
- [ ] Detail returns `name_en` and `name_ar`.
- [ ] Panorama returns texture URLs and hotspots.

## Risks & Open Questions
- Index `(created_at, id)` for pagination performance on large monument lists.
