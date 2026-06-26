import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import type { DataEnvelope } from '../../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  resolveLimit,
} from '../../../shared/utils/cursor-pagination';
import { CategoryResponse, toCategoryResponse } from '../mappers/content.mapper';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<CategoryResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const rows = await this.prisma.category.findMany({
      where: cursorWhereClause(cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(limit), toCategoryResponse);
  }
}
