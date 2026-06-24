# ADR-002: ORM — Prisma

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Heritage Hub backend team

## Context

The ER model is heavily relational (24+ entities, polymorphic associations, bilingual fields). The backend stack ADR (NestJS) prioritized TypeScript type-sharing with the React Native client. Two ORM candidates were evaluated: Prisma and TypeORM.

## Decision

Adopt **Prisma** as the sole ORM for Heritage Hub backend.

## Rationale

- First-class TypeScript types generated from `schema.prisma`
- Strong fit with exclusive nullable FK pattern (see ADR-007) via raw CHECK constraints in migrations
- Excellent migration workflow (`prisma migrate dev`)
- Aligns with NestJS selection criterion: frontend integration and shared schemas
- Seed scripts integrate cleanly (`prisma db seed`)

## Consequences

- All docs must reference **Prisma only** — remove TypeORM alternatives
- Polymorphic associations use exclusive nullable FKs + raw SQL CHECKs (Prisma cannot express multi-column CHECKs in schema)
- `prisma/schema.prisma` is the source of truth for the data model
- Shared types with RN can be exported from generated client or a shared `packages/types` package (decide at implementation)

## Revisit if

- A Prisma limitation blocks a critical query pattern that TypeORM solves materially better (unlikely for this scope)
