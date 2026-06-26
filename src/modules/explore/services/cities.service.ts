import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import type { DataEnvelope } from '../../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  resolveLimit,
} from '../../../shared/utils/cursor-pagination';
import {
  CityDetailResponse,
  CityListItemResponse,
  publishedOnly,
  toCityDetail,
  toCityListItem,
} from '../mappers/content.mapper';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCities(
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<CityListItemResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const rows = await this.prisma.city.findMany({
      where: {
        ...publishedOnly,
        ...cursorWhereClause(cursor),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(limit), toCityListItem);
  }

  async getCity(cityId: string): Promise<CityDetailResponse> {
    const city = await this.prisma.city.findFirst({
      where: { id: cityId, ...publishedOnly },
    });

    if (!city) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'City not found' });
    }

    return toCityDetail(city);
  }
}
