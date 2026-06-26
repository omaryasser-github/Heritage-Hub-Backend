import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { MonumentsQueryDto } from '../dto/monuments-query.dto';
import { MonumentsService } from '../services/monuments.service';

@Controller('monuments')
export class MonumentsController {
  constructor(private readonly monumentsService: MonumentsService) {}

  @Get()
  listMonuments(@Query() query: MonumentsQueryDto) {
    return this.monumentsService.listMonuments(query);
  }

  @Get(':monumentId/awareness')
  getAwareness(@Param('monumentId', ParseUUIDPipe) monumentId: string) {
    return this.monumentsService.getAwareness(monumentId);
  }

  @Get(':monumentId/timeline')
  getTimeline(@Param('monumentId', ParseUUIDPipe) monumentId: string) {
    return this.monumentsService.getTimeline(monumentId);
  }

  @Get(':monumentId/media')
  getMedia(@Param('monumentId', ParseUUIDPipe) monumentId: string) {
    return this.monumentsService.getMedia(monumentId);
  }

  @Get(':monumentId')
  getMonument(@Param('monumentId', ParseUUIDPipe) monumentId: string) {
    return this.monumentsService.getMonument(monumentId);
  }
}
