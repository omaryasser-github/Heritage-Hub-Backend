import { Module } from '@nestjs/common';
import {
  FavoritesController,
  MeFavoritesController,
} from './controllers/favorites.controller';
import { RatingsController } from './controllers/ratings.controller';
import { MeReportsController, ReportsController } from './controllers/reports.controller';
import { ContentTargetService } from './services/content-target.service';
import { FavoritesService } from './services/favorites.service';
import { RatingsService } from './services/ratings.service';
import { ReportsService } from './services/reports.service';

@Module({
  controllers: [
    FavoritesController,
    MeFavoritesController,
    RatingsController,
    ReportsController,
    MeReportsController,
  ],
  providers: [ContentTargetService, FavoritesService, RatingsService, ReportsService],
  exports: [FavoritesService, RatingsService, ReportsService],
})
export class FeedbackModule {}
