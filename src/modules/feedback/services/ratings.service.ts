import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { assertExclusiveTarget } from '../../../shared/validators/exclusive-target';
import { RatingUpsertDto } from '../dto/rating-upsert.dto';
import { ContentTargetService } from './content-target.service';

export interface RatingResponse {
  id: string;
  city_id: string | null;
  monument_id: string | null;
  stars: number;
  updated_at: string;
}

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentTargetService: ContentTargetService,
  ) {}

  async upsertRating(userId: string, dto: RatingUpsertDto): Promise<RatingResponse> {
    const target = assertExclusiveTarget(dto.cityId, dto.monumentId);
    await this.contentTargetService.assertPublishedTarget(target.cityId, target.monumentId);

    if (target.cityId) {
      const rating = await this.prisma.rating.upsert({
        where: { userId_cityId: { userId, cityId: target.cityId } },
        create: { userId, cityId: target.cityId, stars: dto.stars },
        update: { stars: dto.stars },
      });
      return this.toResponse(rating);
    }

    const rating = await this.prisma.rating.upsert({
      where: { userId_monumentId: { userId, monumentId: target.monumentId! } },
      create: { userId, monumentId: target.monumentId!, stars: dto.stars },
      update: { stars: dto.stars },
    });
    return this.toResponse(rating);
  }

  private toResponse(rating: {
    id: string;
    cityId: string | null;
    monumentId: string | null;
    stars: number;
    updatedAt: Date;
  }): RatingResponse {
    return {
      id: rating.id,
      city_id: rating.cityId,
      monument_id: rating.monumentId,
      stars: rating.stars,
      updated_at: rating.updatedAt.toISOString(),
    };
  }
}
