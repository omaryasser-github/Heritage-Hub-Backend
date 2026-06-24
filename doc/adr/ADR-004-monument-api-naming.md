# ADR-004: Content Entity — `Monument` + `/monuments` API

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Heritage Hub backend team

## Context

Docs inconsistently used `ITEM`, `/items`, and `MONUMENT`. Seed data (`Egypt-Tourism-landmarks.json`) and `HERITAGE_HUB_ERD.md` use **monuments** only. Polymorphic FK design (ADR-007) uses `monumentId` everywhere. The API contract previously exposed `/items/:itemId`.

Templates were mentioned as sharing one schema with monuments via a type discriminator, but no template records exist in seed data yet.

## Decision

| Layer | Name |
|---|---|
| **Database (Prisma)** | `Monument` model |
| **Domain / services** | `Monument`, `monumentId` |
| **REST API** | `/v1/monuments`, `/v1/monuments/:monumentId`, sub-resources under that path |
| **Seed JSON** | `monuments` array (unchanged) |

### Templates

Templates are **not** a separate table or API resource. When introduced, they are rows in `Monument` with a `kind` discriminator:

```prisma
enum MonumentKind {
  monument
  template
}
```

Filter via query param: `GET /v1/monuments?kind=monument` or `GET /v1/monuments?kind=template`.

## Rejected

- **`/items` API naming** — adds `itemId` ↔ `monumentId` indirection with no seed/ERD backing
- **Separate `Template` table** — unnecessary while templates share the same schema (revisit only if templates gain a different lifecycle or field set)

## Rationale

- Aligns API, ERD, seed data, and polymorphic FKs (`city_id | monument_id`)
- Domain language matches Egypt tourism context
- No DTO renaming layer between API and database
- `kind` filter handles templates without a generic “item” abstraction

## Consequences

- Replace all `/items` and `:itemId` references in docs and phases with `/monuments` and `:monumentId`
- Favorites: `DELETE /favorites/:monumentId` (city favorites use `cityId` in body on `POST /favorites`)
- Search descriptions say “monuments” not “items”
- Phase 3 controller: `monuments.controller.ts` (not `items.controller.ts`)

## References

- [ADR-007](./ADR-007-polymorphic-associations.md)
- `planing/req-analysis/Egypt-Tourism-landmarks.json`
- `planing/req-analysis/HERITAGE_HUB_ERD.md`
