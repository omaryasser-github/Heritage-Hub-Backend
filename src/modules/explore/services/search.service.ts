import { Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import type { DataEnvelope } from '../../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  decodeCursor,
  resolveLimit,
} from '../../../shared/utils/cursor-pagination';
import { SearchResultResponse } from '../mappers/content.mapper';

const SUGGESTION_DEFAULT_LIMIT = 8;
const SUGGESTION_MAX_LIMIT = 20;

interface RankedSearchHit extends SearchResultResponse {
  createdAt: Date;
  sortKey: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    query: string,
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<SearchResultResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const term = query.trim();
    const merged = await this.collectMatches(term);
    const filtered = this.applyCursor(merged, cursor).slice(0, take);

    return buildPaginatedEnvelope(filtered, resolveLimit(limit), this.toSearchResult.bind(this), (row) => row.sortKey);
  }

  async suggestions(query: string, limit?: number): Promise<SearchResultResponse[]> {
    const term = query.trim();
    const resolvedLimit = Math.min(
      Math.max(limit ?? SUGGESTION_DEFAULT_LIMIT, 1),
      SUGGESTION_MAX_LIMIT,
    );

    const merged = await this.collectPrefixMatches(term);
    return merged.slice(0, resolvedLimit).map(this.toSearchResult);
  }

  private async collectMatches(term: string): Promise<RankedSearchHit[]> {
    const [cities, monuments, categories] = await Promise.all([
      this.prisma.city.findMany({
        where: {
          status: ContentStatus.published,
          OR: [
            { nameEn: { contains: term, mode: 'insensitive' } },
            { nameAr: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          createdAt: true,
        },
      }),
      this.prisma.monument.findMany({
        where: {
          status: ContentStatus.published,
          OR: [
            { nameEn: { contains: term, mode: 'insensitive' } },
            { nameAr: { contains: term, mode: 'insensitive' } },
            { descriptionEn: { contains: term, mode: 'insensitive' } },
            { descriptionAr: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          cityId: true,
          createdAt: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          OR: [
            { nameEn: { contains: term, mode: 'insensitive' } },
            { nameAr: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          createdAt: true,
        },
      }),
    ]);

    return this.rankHits([
      ...cities.map((city) => ({
        type: 'city' as const,
        id: city.id,
        slug: city.slug,
        name_en: city.nameEn,
        name_ar: city.nameAr,
        createdAt: city.createdAt,
        sortKey: `city:${city.id}`,
      })),
      ...monuments.map((monument) => ({
        type: 'monument' as const,
        id: monument.id,
        slug: monument.slug,
        name_en: monument.nameEn,
        name_ar: monument.nameAr,
        city_id: monument.cityId,
        createdAt: monument.createdAt,
        sortKey: `monument:${monument.id}`,
      })),
      ...categories.map((category) => ({
        type: 'category' as const,
        id: category.id,
        slug: category.slug,
        name_en: category.nameEn,
        name_ar: category.nameAr,
        createdAt: category.createdAt,
        sortKey: `category:${category.id}`,
      })),
    ]);
  }

  private async collectPrefixMatches(term: string): Promise<RankedSearchHit[]> {
    const [cities, monuments, categories] = await Promise.all([
      this.prisma.city.findMany({
        where: {
          status: ContentStatus.published,
          OR: [
            { nameEn: { startsWith: term, mode: 'insensitive' } },
            { nameAr: { startsWith: term, mode: 'insensitive' } },
            { slug: { startsWith: term, mode: 'insensitive' } },
          ],
        },
        take: SUGGESTION_MAX_LIMIT,
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          createdAt: true,
        },
      }),
      this.prisma.monument.findMany({
        where: {
          status: ContentStatus.published,
          OR: [
            { nameEn: { startsWith: term, mode: 'insensitive' } },
            { nameAr: { startsWith: term, mode: 'insensitive' } },
            { slug: { startsWith: term, mode: 'insensitive' } },
          ],
        },
        take: SUGGESTION_MAX_LIMIT,
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          cityId: true,
          createdAt: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          OR: [
            { nameEn: { startsWith: term, mode: 'insensitive' } },
            { nameAr: { startsWith: term, mode: 'insensitive' } },
            { slug: { startsWith: term, mode: 'insensitive' } },
          ],
        },
        take: SUGGESTION_MAX_LIMIT,
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          createdAt: true,
        },
      }),
    ]);

    return this.rankHits([
      ...cities.map((city) => ({
        type: 'city' as const,
        id: city.id,
        slug: city.slug,
        name_en: city.nameEn,
        name_ar: city.nameAr,
        createdAt: city.createdAt,
        sortKey: `city:${city.id}`,
      })),
      ...monuments.map((monument) => ({
        type: 'monument' as const,
        id: monument.id,
        slug: monument.slug,
        name_en: monument.nameEn,
        name_ar: monument.nameAr,
        city_id: monument.cityId,
        createdAt: monument.createdAt,
        sortKey: `monument:${monument.id}`,
      })),
      ...categories.map((category) => ({
        type: 'category' as const,
        id: category.id,
        slug: category.slug,
        name_en: category.nameEn,
        name_ar: category.nameAr,
        createdAt: category.createdAt,
        sortKey: `category:${category.id}`,
      })),
    ]);
  }

  private rankHits(hits: RankedSearchHit[]): RankedSearchHit[] {
    return hits.sort((left, right) => {
      const byDate = right.createdAt.getTime() - left.createdAt.getTime();
      if (byDate !== 0) {
        return byDate;
      }

      return right.sortKey.localeCompare(left.sortKey);
    });
  }

  private applyCursor(hits: RankedSearchHit[], cursor?: string): RankedSearchHit[] {
    if (!cursor) {
      return hits;
    }

    const payload = decodeCursor(cursor);
    const cursorDate = new Date(payload.created_at);

    return hits.filter((hit) => {
      if (hit.createdAt < cursorDate) {
        return true;
      }

      if (hit.createdAt.getTime() === cursorDate.getTime() && hit.sortKey < payload.id) {
        return true;
      }

      return false;
    });
  }

  private toSearchResult(hit: RankedSearchHit): SearchResultResponse {
    return {
      type: hit.type,
      id: hit.id,
      slug: hit.slug,
      name_en: hit.name_en,
      name_ar: hit.name_ar,
      ...(hit.city_id ? { city_id: hit.city_id } : {}),
    };
  }
}
