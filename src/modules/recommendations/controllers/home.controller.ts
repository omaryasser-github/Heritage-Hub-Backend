import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/interfaces/authenticated-user.interface';
import { RecommendationsService } from '../recommendations.service';

@Controller('home')
export class HomeController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  getHome(@CurrentUser() user: AuthenticatedUser) {
    return this.recommendationsService.getHome(user.id);
  }
}
