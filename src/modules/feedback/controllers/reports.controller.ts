import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/interfaces/authenticated-user.interface';
import { PaginationQueryDto } from '../../explore/dto/pagination.dto';
import { ReportCreateDto } from '../dto/report-create.dto';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportCreateDto) {
    return this.reportsService.createReport(user.id, dto);
  }
}

@Controller('me/reports')
export class MeReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  listReports(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.reportsService.listReports(user.id, query.cursor, query.limit);
  }
}
