import { Injectable } from '@nestjs/common';
import { Favorite } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import type { DataEnvelope } from '../../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  resolveLimit,
} from '../../../shared/utils/cursor-pagination';
import { assertExclusiveTarget } from '../../../shared/validators/exclusive-target';
import { FavoriteCreateDto } from '../dto/favorite-create.dto';
import { FavoriteTargetType } from '../dto/delete-favorite-query.dto';
import { ContentTargetService } from './content-target.service';

export interface FavoriteResponse {
  id: string;
  city_id: string | null;
  monument_id: string | null;
  created_at: string;
}

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentTargetService: ContentTargetService,
  ) {}

  async listFavorites(
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<FavoriteResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const rows = await this.prisma.favorite.findMany({
      where: { userId, ...cursorWhereClause(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(limit), (row) => this.toResponse(row));
  }

  async addFavorite(userId: string, dto: FavoriteCreateDto): Promise<FavoriteResponse> {
    const target = assertExclusiveTarget(dto.cityId, dto.monumentId);
    await this.contentTargetService.assertPublishedTarget(target.cityId, target.monumentId);

    if (target.cityId) {
      const favorite = await this.prisma.favorite.upsert({
        where: { userId_cityId: { userId, cityId: target.cityId } },
        create: { userId, cityId: target.cityId },
        update: {},
      });
      return this.toResponse(favorite);
    }

    const favorite = await this.prisma.favorite.upsert({
      where: { userId_monumentId: { userId, monumentId: target.monumentId! } },
      create: { userId, monumentId: target.monumentId! },
      update: {},
    });
    return this.toResponse(favorite);
  }

  async removeFavorite(
    userId: string,
    targetId: string,
    type?: FavoriteTargetType,
  ): Promise<void> {
    if (type === FavoriteTargetType.city) {
      await this.prisma.favorite.deleteMany({ where: { userId, cityId: targetId } });
      return;
    }

    if (type === FavoriteTargetType.monument) {
      await this.prisma.favorite.deleteMany({ where: { userId, monumentId: targetId } });
      return;
    }

    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        OR: [{ cityId: targetId }, { monumentId: targetId }],
      },
    });
  }

  private toResponse(favorite: Favorite): FavoriteResponse {
    return {
      id: favorite.id,
      city_id: favorite.cityId,
      monument_id: favorite.monumentId,
      created_at: favorite.createdAt.toISOString(),
    };
  }
}
