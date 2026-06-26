import { Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories.controller';
import { CitiesController } from './controllers/cities.controller';
import { MonumentsController } from './controllers/monuments.controller';
import { SearchController } from './controllers/search.controller';
import { CategoriesService } from './services/categories.service';
import { CitiesService } from './services/cities.service';
import { MonumentsService } from './services/monuments.service';
import { SearchService } from './services/search.service';

@Module({
  controllers: [CitiesController, CategoriesController, MonumentsController, SearchController],
  providers: [CitiesService, CategoriesService, MonumentsService, SearchService],
})
export class ExploreModule {}
