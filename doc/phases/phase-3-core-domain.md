# Phase 3: Core Domain CRUD (Items, Cities, Timeline)

## Objective
Implement paginated query endpoints and detail lookups for Cities, Categories, Monuments (Items), and Timelines, resolving database route naming mismatches.

## Scope
*   **In Scope:**
    *   Build endpoints to retrieve cities (`GET /v1/cities`) and details (`GET /v1/cities/:cityId`).
    *   Implement query endpoints for items (`GET /v1/items`) supporting filtering by `category`, `type` (monument vs template discriminator), and the missing `city_id` filter.
    *   Expose detail retrieval for items (`GET /v1/items/:itemId`).
    *   Resolve route naming inconsistencies:
        *   Standardize the item schema to match the ER model (`item` / `monument` naming).
        *   Resolve timeline query routing: Expose `/v1/items/:itemId/timeline` (fetching chronological events mapped to the item's historical context).
    *   Expose items details media gallery (`GET /v1/items/:itemId/media`) and 360 panorama details (`GET /v1/items/:itemId/panorama`).
    *   Implement cursor-based pagination (opaque cursors) across all list query routes.
*   **Out Scope:**
    *   Handling interactive user signals like favorites, ratings, or feedback submissions (deferred to Phase 4).

## Dependencies / Entry Criteria
- Phase 2 (Auth & Identity) complete.
- Content database seeded with default historical cities, monuments, and timelines.
- Route and naming inconsistencies resolved with the frontend.

## Folder Structure
```text
src/modules/explore/
├── explore.module.ts
├── controllers/
│   ├── cities.controller.ts
│   └── items.controller.ts
├── services/
│   ├── cities.service.ts
│   └── items.service.ts
└── dto/
    ├── cities-query.dto.ts
    ├── items-query.dto.ts
    └── pagination.dto.ts                # Opaque cursor validation
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `GET /v1/cities` (Public)
  - `GET /v1/cities/:cityId` (Public)
  - `GET /v1/items` (Public - query parameters: `city_id`, `category`, `type`, `cursor`, `limit`)
  - `GET /v1/items/:itemId` (Public)
  - `GET /v1/items/:itemId/media` (Public)
  - `GET /v1/items/:itemId/timeline` (Public)
  - `GET /v1/items/:itemId/panorama` (Public)
- **Entities:**
  - `City`
  - `Monument` (Item)
  - `Category`
  - `Panorama`
  - `Hotspot`
  - `MediaAsset`
  - `TimelineEvent`

## Acceptance Criteria
- [ ] List endpoints support pagination using opaque base64-encoded cursors (e.g., cursor contains the last returned record ID and sort value).
- [ ] Querying `/v1/items?city_id=<id>` filters results to that city.
- [ ] Detail endpoints return localized payloads containing both language parameters (`name_en` and `name_ar` etc.).
- [ ] Fetching `/v1/items/:itemId/panorama` returns the panorama texture URLs (`url_low`, `url_medium`, `url_high`) and coordinate-based hotspots.

## Risks & Open Questions
- Generating base64 opaque cursors requires database indexes on the sorting fields (`created_at`, `id`) to ensure paginating through thousands of records does not trigger database-level table scans.
