import { Injectable, Logger } from '@nestjs/common';
import { ContentStatus, PersonalityType } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  AiChatRequest,
  AiChatResponse,
  AiRecommendationsRequest,
  AiRecommendationsResponse,
  AiServiceClient,
} from './ai-service.types';

@Injectable()
export class AiServiceStubClient implements AiServiceClient {
  private readonly logger = new Logger(AiServiceStubClient.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('Using AI service stub client (real FastAPI coming soon)');
  }

  async getRecommendations(request: AiRecommendationsRequest): Promise<AiRecommendationsResponse> {
    const monuments = await this.pickMonuments(request);
    const cities = await this.pickCities(request);

    const items = [
      ...monuments.map((monument) => ({
        type: 'monument' as const,
        id: monument.id,
        reason_en: this.reasonEn(request.personality_type, monument.nameEn),
        reason_ar: this.reasonAr(request.personality_type, monument.nameAr),
      })),
      ...cities.map((city) => ({
        type: 'city' as const,
        id: city.id,
        reason_en: `Recommended city for your ${this.personaLabel(request.personality_type)} style`,
        reason_ar: `مدينة موصى بها لأسلوب ${this.personaLabelAr(request.personality_type)}`,
      })),
    ];

    return { items: items.slice(0, 6) };
  }

  async getChatCompletion(request: AiChatRequest): Promise<AiChatResponse> {
    const trimmed = request.message.trim();
    const reply = trimmed
      ? `Heritage Hub (stub): I received "${trimmed.slice(0, 120)}". Ask me about Egyptian monuments and cities when the live AI service is connected.`
      : 'Heritage Hub (stub): How can I help you explore Egypt?';

    return { reply };
  }

  private async pickMonuments(request: AiRecommendationsRequest) {
    const favoriteIds = request.favorite_monument_ids;
    if (favoriteIds.length > 0) {
      const favorites = await this.prisma.monument.findMany({
        where: { id: { in: favoriteIds }, status: ContentStatus.published },
        take: 4,
      });
      if (favorites.length > 0) {
        return favorites;
      }
    }

    return this.prisma.monument.findMany({
      where: { status: ContentStatus.published },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
  }

  private async pickCities(request: AiRecommendationsRequest) {
    const favoriteIds = request.favorite_city_ids;
    if (favoriteIds.length > 0) {
      const favorites = await this.prisma.city.findMany({
        where: { id: { in: favoriteIds }, status: ContentStatus.published },
        take: 2,
      });
      if (favorites.length > 0) {
        return favorites;
      }
    }

    return this.prisma.city.findMany({
      where: { status: ContentStatus.published },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
  }

  private reasonEn(personality: PersonalityType | null, name: string): string {
    return `Because your ${this.personaLabel(personality)} profile matches ${name}`;
  }

  private reasonAr(personality: PersonalityType | null, name: string): string {
    return `لأن ملفك كـ${this.personaLabelAr(personality)} يناسب ${name}`;
  }

  private personaLabel(personality: PersonalityType | null): string {
    if (!personality) {
      return 'Explorer';
    }
    return personality.replace('_', ' ');
  }

  private personaLabelAr(personality: PersonalityType | null): string {
    if (!personality) {
      return 'مستكشف';
    }
    const labels: Record<PersonalityType, string> = {
      explorer: 'مستكشف',
      historian: 'مؤرخ',
      strategist: 'استراتيجي',
      culture_lover: 'عاشق الثقافة',
    };
    return labels[personality];
  }
}
