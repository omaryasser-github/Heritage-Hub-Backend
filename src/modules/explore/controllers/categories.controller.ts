import { Controller, Get, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../dto/pagination.dto';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  listCategories(@Query() query: PaginationQueryDto) {
    return this.categoriesService.listCategories(query.cursor, query.limit);
  }
}
