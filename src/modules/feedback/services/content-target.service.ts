import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { assertExclusiveTarget } from '../../../shared/validators/exclusive-target';

@Injectable()
export class ContentTargetService {
  constructor(private readonly prisma: PrismaService) {}

  async assertPublishedTarget(cityId?: string, monumentId?: string): Promise<void> {
    assertExclusiveTarget(cityId, monumentId);

    if (cityId) {
      const city = await this.prisma.city.findFirst({
        where: { id: cityId, status: ContentStatus.published },
        select: { id: true },
      });
      if (!city) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'City not found' });
      }
      return;
    }

    const monument = await this.prisma.monument.findFirst({
      where: { id: monumentId!, status: ContentStatus.published },
      select: { id: true },
    });
    if (!monument) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Monument not found' });
    }
  }
}
