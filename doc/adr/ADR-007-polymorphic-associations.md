# ADR-007: Polymorphic Associations — Exclusive Nullable FKs

- **Status:** Accepted
- **Date:** 2026-06-24
- **Database:** PostgreSQL
- **ORM:** Prisma (see ADR-002)

## Decision

Use **exclusive nullable foreign keys** (`city_id?` / `monument_id?` + Postgres CHECK) for content tables with a small fixed target set. Keep **string-based** `entity_type` + `entity_id` only for high-volume logs and soft references.

| Table | Targets | Pattern |
|---|---|---|
| `FAVORITE` | city, monument | Exclusive FK |
| `RATING` | city, monument | Exclusive FK |
| `REPORT` | city, monument | Exclusive FK |
| `MEDIA_ASSET` | city, monument | Exclusive FK |
| `AWARENESS_CARD` | city, monument | Exclusive FK |
| `QUIZ` | city, monument | Exclusive FK |
| `CHALLENGE.target` | city, monument | Exclusive FK (at most one; optional) |
| `USER_INTERACTION` | city, monument, panorama, hotspot | String-based (by design) |
| `XP_TRANSACTION.source_id` | many event types | String-based (MVP-deferred) |
| `NOTIFICATION.source_id` | many | String-based (soft deep-link ref) |

**Rejected:** generic `entity_type` + `entity_id` string polymorphism on integrity-critical tables.

## Why

- Real referential integrity + native `ON DELETE CASCADE` for content relations
- Prisma-compatible (CHECK constraints in raw migration SQL)
- High-volume `USER_INTERACTION` avoids FK overhead; orphan rows acceptable for analytics

## Revisit if

- A 3rd+ content parent type is added → new nullable FK column + CHECK update
- Interaction volume requires table partitioning

---

## 1. The Exclusive Nullable FK Pattern

Instead of one `entity_id` + an `entity_type` discriminator, each table gets **one nullable FK per possible parent**, plus a database **CHECK** enforcing that *exactly one* is set.

```prisma
model Rating {
  id         String    @id @default(uuid()) @db.Uuid
  userId     String    @db.Uuid
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  cityId     String?   @db.Uuid
  city       City?     @relation(fields: [cityId], references: [id], onDelete: Cascade)
  monumentId String?   @db.Uuid
  monument   Monument? @relation(fields: [monumentId], references: [id], onDelete: Cascade)

  stars      Int
  updatedAt  DateTime  @updatedAt

  @@unique([userId, cityId])
  @@unique([userId, monumentId])
  @@index([cityId])
  @@index([monumentId])
  @@map("rating")
}
```

The "exactly one set" rule lives in migration SQL as a raw CHECK (see §5).

---

## 2. Converted Prisma Models

See full models in the implementation `prisma/schema.prisma`. Key models: `Favorite`, `Rating`, `Report`, `MediaAsset`, `AwarenessCard`, `Quiz`, `Challenge`.

`CHALLENGE` target is *optional* — CHECK is **at most one**, not exactly one. Deleting the target uses `onDelete: SetNull`.

---

## 3. String-Based Tables (intentional)

```prisma
model UserInteraction {
  id              String                @id @default(uuid()) @db.Uuid
  userId          String                @db.Uuid
  user            User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  entityType      InteractionEntityType
  entityId        String                @db.Uuid   // NOT a FK — soft reference
  actionType      InteractionActionType
  durationSeconds Int?
  createdAt       DateTime              @default(now())

  @@index([entityType, entityId])
  @@index([userId, createdAt])
  @@map("user_interaction")
}
```

`XP_TRANSACTION` and `NOTIFICATION.source_id` remain soft references. Gamification tables are MVP-deferred (ADR-003).

**`InteractionActionType` (MVP — align with [interaction-telemetry.md](../plans/interaction-telemetry.md)):** `view_monument`, `view_city`, `view_panorama`, `search`, `view_home`.

**`InteractionEntityType`:** `city`, `monument`, `panorama`.

Add `eventId` (unique) on `UserInteraction` for client dedupe.

---

## 4. Migration SQL — CHECK Constraints

```sql
ALTER TABLE favorite        ADD CONSTRAINT favorite_arc_chk        CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE rating          ADD CONSTRAINT rating_arc_chk          CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE report          ADD CONSTRAINT report_arc_chk          CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE media_asset     ADD CONSTRAINT media_asset_arc_chk     CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE awareness_card  ADD CONSTRAINT awareness_card_arc_chk  CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE quiz            ADD CONSTRAINT quiz_arc_chk            CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE challenge       ADD CONSTRAINT challenge_target_arc_chk CHECK (num_nonnulls(target_city_id, target_monument_id) <= 1);
```

---

## 5. NULL + UNIQUE nuance

Postgres `NULLS DISTINCT` (default): `@@unique([userId, cityId])` and `@@unique([userId, monumentId])` enforce one rating/favorite per user per entity without partial indexes. Do **not** use `NULLS NOT DISTINCT`.

---

## 6. API DTO mapping (reports & ratings)

Request bodies use **concrete FK fields**, not `target_type` / `target_id`:

```json
// POST /ratings — exactly one of cityId or monumentId
{ "monumentId": "uuid", "stars": 4 }

// POST /reports
{ "monumentId": "uuid", "reason": "inaccurate", "description": "..." }
```

---

## 7. Query cheatsheet

```ts
prisma.monument.findUnique({ where: { id }, include: { mediaAssets: true } });
prisma.favorite.findUnique({ where: { userId_monumentId: { userId, monumentId } } });
prisma.monument.delete({ where: { id } }); // cascades favorites, ratings, media, etc.
prisma.userInteraction.findMany({ where: { entityType: 'monument', entityId } });
```

---

## References

- [ADR-004](./ADR-004-monument-api-naming.md) — `Monument` naming
- [interaction-telemetry.md](../plans/interaction-telemetry.md) — `USER_INTERACTION` intake
- Original detailed draft: `planing/req-analysis/Polymorphic-FK-Design.md`
