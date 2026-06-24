import { PrismaClient } from '@prisma/client';

/**
 * Phase 1 acceptance checks — run against a seeded database:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/verify-phase1.ts
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const monument = await prisma.monument.findFirst({
    include: { panorama: true, mediaAssets: true, ratings: true, favorites: true },
  });

  if (!monument) {
    throw new Error('No monuments found — run prisma db seed first');
  }

  const user = await prisma.user.create({
    data: {
      email: `phase1-verify-${Date.now()}@example.com`,
      passwordHash: 'hash',
    },
  });

  await prisma.rating.create({
    data: {
      userId: user.id,
      monumentId: monument.id,
      stars: 4,
    },
  });

  await prisma.favorite.create({
    data: {
      userId: user.id,
      monumentId: monument.id,
    },
  });

  await prisma.mediaAsset.create({
    data: {
      monumentId: monument.id,
      assetType: 'photo',
      url: 'https://example.com/photo.jpg',
    },
  });

  await prisma.panorama.create({
    data: {
      monumentId: monument.id,
      urlLow: 'https://example.com/low.jpg',
      urlMedium: 'https://example.com/med.jpg',
      urlHigh: 'https://example.com/high.jpg',
    },
  });

  const monumentId = monument.id;
  await prisma.monument.delete({ where: { id: monumentId } });

  const [rating, favorite, media, panorama] = await Promise.all([
    prisma.rating.findFirst({ where: { monumentId } }),
    prisma.favorite.findFirst({ where: { monumentId } }),
    prisma.mediaAsset.findFirst({ where: { monumentId } }),
    prisma.panorama.findFirst({ where: { monumentId } }),
  ]);

  if (rating || favorite || media || panorama) {
    throw new Error('Cascade delete failed — child rows still exist');
  }

  console.log('✓ Monument cascade delete verified');

  let checkRejected = false;
  try {
    await prisma.rating.create({
      data: {
        userId: user.id,
        stars: 3,
      },
    });
  } catch {
    checkRejected = true;
  }

  if (!checkRejected) {
    throw new Error('CHECK constraint failed — rating without target was accepted');
  }

  console.log('✓ Exclusive FK CHECK constraint verified');

  const city = await prisma.city.findFirstOrThrow();
  const otherMonument = await prisma.monument.findFirstOrThrow();

  let dualTargetRejected = false;
  try {
    await prisma.$executeRaw`
      INSERT INTO rating (id, user_id, city_id, monument_id, stars, updated_at)
      VALUES (gen_random_uuid(), ${user.id}::uuid, ${city.id}::uuid, ${otherMonument.id}::uuid, 2, NOW())
    `;
  } catch {
    dualTargetRejected = true;
  }

  if (!dualTargetRejected) {
    throw new Error('CHECK constraint failed — rating with both targets was accepted');
  }

  console.log('✓ Dual-target CHECK constraint verified');

  await prisma.user.delete({ where: { id: user.id } });
  console.log('Phase 1 verification passed');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
