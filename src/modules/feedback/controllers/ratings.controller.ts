import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/interfaces/authenticated-user.interface';
import { RatingUpsertDto } from '../dto/rating-upsert.dto';
import { RatingsService } from '../services/ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  upsertRating(@CurrentUser() user: AuthenticatedUser, @Body() dto: RatingUpsertDto) {
    return this.ratingsService.upsertRating(user.id, dto);
  }
}
