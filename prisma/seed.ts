import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

interface LandmarksDataset {
  categories: Array<{
    uuid: string;
    slug: string;
    name_en: string;
    name_ar: string;
  }>;
  cities: Array<{
    uuid: string;
    slug: string;
    name_en: string;
    name_ar: string;
    governorate: string;
    governorate_ar: string;
    latitude: number;
    longitude: number;
  }>;
  monuments: Array<{
    uuid: string;
    slug: string;
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    subcategory?: string;
    latitude: number;
    longitude: number;
    thumbnail_url?: string;
    entry_fee?: string;
    opening_hours?: string;
    tags?: string[];
    city_uuid: string;
    category_uuids: string[];
  }>;
}

const prisma = new PrismaClient();

function loadDataset(): LandmarksDataset {
  const filePath = join(
    __dirname,
    '..',
    'planing',
    'req-analysis',
    'Egypt-Tourism-landmarks.json',
  );
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as LandmarksDataset;
}

async function main(): Promise<void> {
  const dataset = loadDataset();

  console.log(`Seeding ${dataset.categories.length} categories...`);
  for (const category of dataset.categories) {
    await prisma.category.upsert({
      where: { id: category.uuid },
      create: {
        id: category.uuid,
        slug: category.slug,
        nameEn: category.name_en,
        nameAr: category.name_ar,
      },
      update: {
        slug: category.slug,
        nameEn: category.name_en,
        nameAr: category.name_ar,
      },
    });
  }

  console.log(`Seeding ${dataset.cities.length} cities...`);
  for (const city of dataset.cities) {
    await prisma.city.upsert({
      where: { id: city.uuid },
      create: {
        id: city.uuid,
        slug: city.slug,
        nameEn: city.name_en,
        nameAr: city.name_ar,
        governorate: city.governorate,
        governorateAr: city.governorate_ar,
        latitude: city.latitude,
        longitude: city.longitude,
        status: 'published',
      },
      update: {
        slug: city.slug,
        nameEn: city.name_en,
        nameAr: city.name_ar,
        governorate: city.governorate,
        governorateAr: city.governorate_ar,
        latitude: city.latitude,
        longitude: city.longitude,
      },
    });
  }

  console.log(`Seeding ${dataset.monuments.length} monuments...`);
  for (const monument of dataset.monuments) {
    await prisma.monument.upsert({
      where: { id: monument.uuid },
      create: {
        id: monument.uuid,
        cityId: monument.city_uuid,
        slug: monument.slug,
        nameEn: monument.name_en,
        nameAr: monument.name_ar,
        descriptionEn: monument.description_en,
        descriptionAr: monument.description_ar,
        subcategory: monument.subcategory ?? null,
        latitude: monument.latitude,
        longitude: monument.longitude,
        thumbnailUrl: monument.thumbnail_url || null,
        entryFee: monument.entry_fee || null,
        openingHours: monument.opening_hours || null,
        tags: monument.tags ?? [],
        kind: 'monument',
        status: 'published',
        categories: {
          connect: monument.category_uuids.map((id) => ({ id })),
        },
      },
      update: {
        cityId: monument.city_uuid,
        slug: monument.slug,
        nameEn: monument.name_en,
        nameAr: monument.name_ar,
        descriptionEn: monument.description_en,
        descriptionAr: monument.description_ar,
        subcategory: monument.subcategory ?? null,
        latitude: monument.latitude,
        longitude: monument.longitude,
        thumbnailUrl: monument.thumbnail_url || null,
        entryFee: monument.entry_fee || null,
        openingHours: monument.opening_hours || null,
        tags: monument.tags ?? [],
        categories: {
          set: monument.category_uuids.map((id) => ({ id })),
        },
      },
    });
  }

  const counts = await Promise.all([
    prisma.category.count(),
    prisma.city.count(),
    prisma.monument.count(),
  ]);

  console.log(
    `Seed complete — categories: ${counts[0]}, cities: ${counts[1]}, monuments: ${counts[2]}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
