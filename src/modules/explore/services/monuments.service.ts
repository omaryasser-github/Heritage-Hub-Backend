import { Injectable, NotFoundException } from '@nestjs/common';
import { MonumentKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import type { DataEnvelope } from '../../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  resolveLimit,
} from '../../../shared/utils/cursor-pagination';
import {
  AwarenessCardResponse,
  MediaAssetResponse,
  MonumentDetailResponse,
  MonumentListItemResponse,
  TimelineEventResponse,
  publishedOnly,
  toAwarenessCardResponse,
  toMediaAssetResponse,
  toMonumentDetail,
  toMonumentListItem,
  toTimelineEventResponse,
} from '../mappers/content.mapper';
import { MonumentsQueryDto } from '../dto/monuments-query.dto';

const monumentCategoriesInclude = {
  categories: true,
} satisfies Prisma.MonumentInclude;

@Injectable()
export class MonumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMonuments(query: MonumentsQueryDto): Promise<DataEnvelope<MonumentListItemResponse[]>> {
    const take = resolveLimit(query.limit) + 1;
    const kind = query.kind ?? MonumentKind.monument;

    const where: Prisma.MonumentWhereInput = {
      ...publishedOnly,
      kind,
      ...cursorWhereClause(query.cursor),
      ...(query.city_id ? { cityId: query.city_id } : {}),
      ...(query.category
        ? { categories: { some: { slug: query.category } } }
        : {}),
    };

    const rows = await this.prisma.monument.findMany({
      where,
      include: monumentCategoriesInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(query.limit), toMonumentListItem);
  }

  async getMonument(monumentId: string): Promise<MonumentDetailResponse> {
    const monument = await this.prisma.monument.findFirst({
      where: { id: monumentId, ...publishedOnly },
      include: monumentCategoriesInclude,
    });

    if (!monument) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Monument not found' });
    }

    return toMonumentDetail(monument);
  }

  async getAwareness(monumentId: string): Promise<AwarenessCardResponse[]> {
    await this.assertMonumentExists(monumentId);

    const cards = await this.prisma.awarenessCard.findMany({
      where: { monumentId },
      orderBy: { createdAt: 'asc' },
    });

    return cards.map(toAwarenessCardResponse);
  }

  async getTimeline(monumentId: string): Promise<TimelineEventResponse[]> {
    await this.assertMonumentExists(monumentId);

    const events = await this.prisma.timelineEvent.findMany({
      where: { monumentId },
      orderBy: [{ displayOrder: 'asc' }, { year: 'asc' }],
    });

    return events.map(toTimelineEventResponse);
  }

  async getMedia(monumentId: string): Promise<MediaAssetResponse[]> {
    await this.assertMonumentExists(monumentId);

    const assets = await this.prisma.mediaAsset.findMany({
      where: { monumentId },
      orderBy: { createdAt: 'asc' },
    });

    return assets.map(toMediaAssetResponse);
  }

  private async assertMonumentExists(monumentId: string): Promise<void> {
    const monument = await this.prisma.monument.findFirst({
      where: { id: monumentId, ...publishedOnly },
      select: { id: true },
    });

    if (!monument) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Monument not found' });
    }
  }
}
