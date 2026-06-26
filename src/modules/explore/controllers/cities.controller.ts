import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../dto/pagination.dto';
import { CitiesService } from '../services/cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  listCities(@Query() query: PaginationQueryDto) {
    return this.citiesService.listCities(query.cursor, query.limit);
  }

  @Get(':cityId')
  getCity(@Param('cityId', ParseUUIDPipe) cityId: string) {
    return this.citiesService.getCity(cityId);
  }
}
