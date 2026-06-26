import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Report, ReportReason, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import type { DataEnvelope } from '../../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  resolveLimit,
} from '../../../shared/utils/cursor-pagination';
import { assertExclusiveTarget } from '../../../shared/validators/exclusive-target';
import { MAX_REPORTS_PER_DAY } from '../feedback.constants';
import { ReportCreateDto } from '../dto/report-create.dto';
import { ContentTargetService } from './content-target.service';

export interface ReportResponse {
  id: string;
  city_id: string | null;
  monument_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentTargetService: ContentTargetService,
  ) {}

  async createReport(userId: string, dto: ReportCreateDto): Promise<ReportResponse> {
    await this.assertDailyReportLimit(userId);

    const target = assertExclusiveTarget(dto.cityId, dto.monumentId);
    await this.contentTargetService.assertPublishedTarget(target.cityId, target.monumentId);

    const report = await this.prisma.report.create({
      data: {
        userId,
        cityId: target.cityId ?? null,
        monumentId: target.monumentId ?? null,
        reason: dto.reason,
        description: dto.description ?? null,
      },
    });

    return this.toResponse(report);
  }

  async listReports(
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<ReportResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const rows = await this.prisma.report.findMany({
      where: { userId, ...cursorWhereClause(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(limit), (row) => this.toResponse(row));
  }

  private async assertDailyReportLimit(userId: string): Promise<void> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.report.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });

    if (count >= MAX_REPORTS_PER_DAY) {
      throw new HttpException(
        {
          code: 'TOO_MANY_REQUESTS',
          message: `Maximum ${MAX_REPORTS_PER_DAY} reports per day exceeded`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private toResponse(report: Report): ReportResponse {
    return {
      id: report.id,
      city_id: report.cityId,
      monument_id: report.monumentId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      created_at: report.createdAt.toISOString(),
    };
  }
}
