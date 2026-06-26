import {
  AwarenessCard,
  AwarenessCardType,
  Category,
  City,
  ContentStatus,
  MediaAsset,
  MediaAssetType,
  Monument,
  MonumentKind,
  TimelineEvent,
} from '@prisma/client';

type MonumentWithCategories = Monument & { categories: Category[] };

export interface CategoryResponse {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
}

export interface CityListItemResponse {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  governorate: string;
  governorate_ar: string;
  thumbnail_url: string | null;
  latitude: number;
  longitude: number;
}

export interface CityDetailResponse extends CityListItemResponse {
  description_en: string | null;
  description_ar: string | null;
}

export interface MonumentListItemResponse {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  city_id: string;
  thumbnail_url: string | null;
  latitude: number;
  longitude: number;
  kind: MonumentKind;
  category_slugs: string[];
}

export interface MonumentDetailResponse {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  city_id: string;
  subcategory: string | null;
  latitude: number;
  longitude: number;
  thumbnail_url: string | null;
  entry_fee: string | null;
  opening_hours: string | null;
  tags: string[];
  kind: MonumentKind;
  category_slugs: string[];
}

export interface AwarenessCardResponse {
  id: string;
  card_type: AwarenessCardType;
  body_en: string;
  body_ar: string;
}

export interface TimelineEventResponse {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string | null;
  year: number;
  era: string | null;
  display_order: number;
}

export interface MediaAssetResponse {
  id: string;
  asset_type: MediaAssetType;
  url: string;
  caption_en: string | null;
  caption_ar: string | null;
}

export interface SearchResultResponse {
  type: 'city' | 'monument' | 'category';
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  city_id?: string;
}

export const publishedOnly = { status: ContentStatus.published } as const;

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    slug: category.slug,
    name_en: category.nameEn,
    name_ar: category.nameAr,
  };
}

export function toCityListItem(city: City): CityListItemResponse {
  return {
    id: city.id,
    slug: city.slug,
    name_en: city.nameEn,
    name_ar: city.nameAr,
    governorate: city.governorate,
    governorate_ar: city.governorateAr,
    thumbnail_url: city.thumbnailUrl,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

export function toCityDetail(city: City): CityDetailResponse {
  return {
    ...toCityListItem(city),
    description_en: city.descriptionEn,
    description_ar: city.descriptionAr,
  };
}

export function toMonumentListItem(monument: MonumentWithCategories): MonumentListItemResponse {
  return {
    id: monument.id,
    slug: monument.slug,
    name_en: monument.nameEn,
    name_ar: monument.nameAr,
    city_id: monument.cityId,
    thumbnail_url: monument.thumbnailUrl,
    latitude: monument.latitude,
    longitude: monument.longitude,
    kind: monument.kind,
    category_slugs: monument.categories.map((category) => category.slug),
  };
}

export function toMonumentDetail(monument: MonumentWithCategories): MonumentDetailResponse {
  return {
    id: monument.id,
    slug: monument.slug,
    name_en: monument.nameEn,
    name_ar: monument.nameAr,
    description_en: monument.descriptionEn,
    description_ar: monument.descriptionAr,
    city_id: monument.cityId,
    subcategory: monument.subcategory,
    latitude: monument.latitude,
    longitude: monument.longitude,
    thumbnail_url: monument.thumbnailUrl,
    entry_fee: monument.entryFee,
    opening_hours: monument.openingHours,
    tags: monument.tags,
    kind: monument.kind,
    category_slugs: monument.categories.map((category) => category.slug),
  };
}

export function toAwarenessCardResponse(card: AwarenessCard): AwarenessCardResponse {
  return {
    id: card.id,
    card_type: card.cardType,
    body_en: card.bodyEn,
    body_ar: card.bodyAr,
  };
}

export function toTimelineEventResponse(event: TimelineEvent): TimelineEventResponse {
  return {
    id: event.id,
    title_en: event.titleEn,
    title_ar: event.titleAr,
    description_en: event.descriptionEn,
    description_ar: event.descriptionAr,
    image_url: event.imageUrl,
    year: event.year,
    era: event.era,
    display_order: event.displayOrder,
  };
}

export function toMediaAssetResponse(asset: MediaAsset): MediaAssetResponse {
  return {
    id: asset.id,
    asset_type: asset.assetType,
    url: asset.url,
    caption_en: asset.captionEn,
    caption_ar: asset.captionAr,
  };
}