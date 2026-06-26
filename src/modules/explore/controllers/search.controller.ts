import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto, SearchSuggestionsQueryDto } from '../dto/search-query.dto';
import { SearchService } from '../services/search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('suggestions')
  getSuggestions(@Query() query: SearchSuggestionsQueryDto) {
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
    return this.searchService.suggestions(query.q, Number.isFinite(limit) ? limit : undefined);
  }

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query.q, query.cursor, query.limit);
  }
}
