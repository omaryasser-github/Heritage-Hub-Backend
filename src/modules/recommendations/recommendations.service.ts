import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContentStatus, PersonalityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { PERSONA_CATEGORY_SLUGS } from '../personality/data/personality-quiz.data';
import { AiRecommendationItem, AiServiceClient } from './clients/ai-service.types';
import {
  AI_SERVICE_CLIENT,
  FEATURED_MONUMENTS_LIMIT,
  MIN_FOR_YOU_ITEMS,
  RECENT_INTERACTIONS_LIMIT,
  SNAPSHOT_TTL_DAYS,
} from './recommendations.constants';

export interface HomeFeedItem {
  type: 'monument' | 'city';
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  thumbnail_url: string | null;
  reason_en: string;
  reason_ar: string;
}

export interface HomeResponse {
  for_you: {
    source: 'snapshot' | 'fallback';
    items: HomeFeedItem[];
  };
  featured_monuments: Array<{
    id: string;
    slug: string;
    name_en: string;
    name_ar: string;
    thumbnail_url: string | null;
    city_id: string;
  }>;
  generated_at: string | null;
}

interface SnapshotPayload {
  items: AiRecommendationItem[];
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_SERVICE_CLIENT) private readonly aiClient: AiServiceClient,
  ) {}

  async getHome(userId: string): Promise<HomeResponse> {
    const featuredMonuments = await this.getFeaturedMonuments();
    const snapshot = await this.getValidSnapshot(userId);

    if (snapshot) {
      const items = await this.enrichItems(snapshot.items);
      const padded = await this.padItems(items, userId);

      return {
        for_you: { source: 'snapshot', items: padded },
        featured_monuments: featuredMonuments,
        generated_at: snapshot.generatedAt.toISOString(),
      };
    }

    const fallbackItems = await this.buildFallbackItems(userId);
    return {
      for_you: { source: 'fallback', items: fallbackItems },
      featured_monuments: featuredMonuments,
      generated_at: null,
    };
  }

  async refreshSnapshotForUser(userId: string): Promise<void> {
    try {
      const signals = await this.buildSignals(userId);
      const response = await this.aiClient.getRecommendations(signals);

      await this.prisma.recommendationSnapshot.create({
        data: {
          userId,
          recommendations: { items: response.items } as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Recommendation refresh failed for user ${userId}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async buildSignals(userId: string) {
    const [profile, favorites, interactions] = await Promise.all([
      this.prisma.personalityProfile.findUnique({ where: { userId } }),
      this.prisma.favorite.findMany({ where: { userId } }),
      this.prisma.userInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_INTERACTIONS_LIMIT,
      }),
    ]);

    return {
      user_id: userId,
      personality_type: profile?.personalityType ?? null,
      favorite_monument_ids: favorites
        .map((favorite) => favorite.monumentId)
        .filter((id): id is string => Boolean(id)),
      favorite_city_ids: favorites
        .map((favorite) => favorite.cityId)
        .filter((id): id is string => Boolean(id)),
      recent_interactions: interactions.map((interaction) => ({
        action_type: interaction.actionType,
        entity_type: interaction.entityType,
        entity_id: interaction.entityId,
      })),
    };
  }

  private async getValidSnapshot(userId: string): Promise<{
    items: AiRecommendationItem[];
    generatedAt: Date;
  } | null> {
    const snapshot = await this.prisma.recommendationSnapshot.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });

    if (!snapshot) {
      return null;
    }

    const ttlMs = SNAPSHOT_TTL_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - snapshot.generatedAt.getTime() > ttlMs) {
      return null;
    }

    const payload = snapshot.recommendations as unknown as SnapshotPayload;
    if (!payload?.items?.length) {
      return null;
    }

    return { items: payload.items, generatedAt: snapshot.generatedAt };
  }

  private async enrichItems(items: AiRecommendationItem[]): Promise<HomeFeedItem[]> {
    const enriched: HomeFeedItem[] = [];

    for (const item of items) {
      if (item.type === 'monument') {
        const monument = await this.prisma.monument.findFirst({
          where: { id: item.id, status: ContentStatus.published },
        });
        if (monument) {
          enriched.push({
            type: 'monument',
            id: monument.id,
            slug: monument.slug,
            name_en: monument.nameEn,
            name_ar: monument.nameAr,
            thumbnail_url: monument.thumbnailUrl,
            reason_en: item.reason_en,
            reason_ar: item.reason_ar,
          });
        }
        continue;
      }

      const city = await this.prisma.city.findFirst({
        where: { id: item.id, status: ContentStatus.published },
      });
      if (city) {
        enriched.push({
          type: 'city',
          id: city.id,
          slug: city.slug,
          name_en: city.nameEn,
          name_ar: city.nameAr,
          thumbnail_url: city.thumbnailUrl,
          reason_en: item.reason_en,
          reason_ar: item.reason_ar,
        });
      }
    }

    return enriched;
  }

  private async padItems(items: HomeFeedItem[], userId: string): Promise<HomeFeedItem[]> {
    if (items.length >= MIN_FOR_YOU_ITEMS) {
      return items;
    }

    const fallback = await this.buildFallbackItems(userId);
    const seen = new Set(items.map((item) => `${item.type}:${item.id}`));

    for (const item of fallback) {
      const key = `${item.type}:${item.id}`;
      if (!seen.has(key)) {
        items.push(item);
        seen.add(key);
      }
      if (items.length >= MIN_FOR_YOU_ITEMS) {
        break;
      }
    }

    return items;
  }

  private async buildFallbackItems(userId: string): Promise<HomeFeedItem[]> {
    const personality = await this.prisma.personalityProfile.findUnique({ where: { userId } });
    const items: HomeFeedItem[] = [];

    if (personality) {
      const slugs = PERSONA_CATEGORY_SLUGS[personality.personalityType];
      const monuments = await this.prisma.monument.findMany({
        where: {
          status: ContentStatus.published,
          categories: { some: { slug: { in: slugs } } },
        },
        take: MIN_FOR_YOU_ITEMS,
        orderBy: { createdAt: 'desc' },
      });

      for (const monument of monuments) {
        items.push(this.monumentToFeedItem(monument, personality.personalityType));
      }
    }

    if (items.length < MIN_FOR_YOU_ITEMS) {
      const topRated = await this.getTopRatedMonuments(MIN_FOR_YOU_ITEMS);
      this.mergeUnique(items, topRated);
    }

    if (items.length < MIN_FOR_YOU_ITEMS) {
      const recent = await this.prisma.monument.findMany({
        where: { status: ContentStatus.published },
        orderBy: { createdAt: 'desc' },
        take: MIN_FOR_YOU_ITEMS,
      });
      this.mergeUnique(
        items,
        recent.map((monument) => this.monumentToFeedItem(monument, null)),
      );
    }

    return items.slice(0, Math.max(MIN_FOR_YOU_ITEMS, items.length));
  }

  private async getTopRatedMonuments(limit: number): Promise<HomeFeedItem[]> {
    const ratings = await this.prisma.rating.findMany({
      where: { monumentId: { not: null } },
      select: { monumentId: true, stars: true },
    });

    const scores = new Map<string, { total: number; count: number }>();
    for (const rating of ratings) {
      if (!rating.monumentId) {
        continue;
      }
      const current = scores.get(rating.monumentId) ?? { total: 0, count: 0 };
      current.total += rating.stars;
      current.count += 1;
      scores.set(rating.monumentId, current);
    }

    const monumentIds = [...scores.entries()]
      .sort((left, right) => right[1].total / right[1].count - left[1].total / left[1].count)
      .slice(0, limit)
      .map(([monumentId]) => monumentId);

    if (monumentIds.length === 0) {
      return [];
    }

    const monuments = await this.prisma.monument.findMany({
      where: { id: { in: monumentIds }, status: ContentStatus.published },
    });

    const byId = new Map(monuments.map((monument) => [monument.id, monument]));
    return monumentIds
      .map((id) => byId.get(id))
      .filter((monument): monument is NonNullable<typeof monument> => Boolean(monument))
      .map((monument) =>
        this.monumentToFeedItem(monument, null, 'Top rated by travelers', 'الأعلى تقييماً من المسافرين'),
      );
  }

  private monumentToFeedItem(
    monument: {
      id: string;
      slug: string;
      nameEn: string;
      nameAr: string;
      thumbnailUrl: string | null;
    },
    personality: PersonalityType | null,
    reasonEn?: string,
    reasonAr?: string,
  ): HomeFeedItem {
    return {
      type: 'monument',
      id: monument.id,
      slug: monument.slug,
      name_en: monument.nameEn,
      name_ar: monument.nameAr,
      thumbnail_url: monument.thumbnailUrl,
      reason_en: reasonEn ?? `Suggested for your ${personality ?? 'explorer'} travel style`,
      reason_ar:
        reasonAr ?? `مقترح لأسلوب سفرك كـ${personality ?? 'explorer'}`,
    };
  }

  private mergeUnique(target: HomeFeedItem[], source: HomeFeedItem[]): void {
    const seen = new Set(target.map((item) => `${item.type}:${item.id}`));
    for (const item of source) {
      const key = `${item.type}:${item.id}`;
      if (!seen.has(key)) {
        target.push(item);
        seen.add(key);
      }
    }
  }

  private async getFeaturedMonuments() {
    const monuments = await this.prisma.monument.findMany({
      where: { status: ContentStatus.published, kind: 'monument' },
      orderBy: { createdAt: 'desc' },
      take: FEATURED_MONUMENTS_LIMIT,
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        thumbnailUrl: true,
        cityId: true,
      },
    });

    return monuments.map((monument) => ({
      id: monument.id,
      slug: monument.slug,
      name_en: monument.nameEn,
      name_ar: monument.nameAr,
      thumbnail_url: monument.thumbnailUrl,
      city_id: monument.cityId,
    }));
  }
}
