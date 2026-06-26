import { Module } from '@nestjs/common';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { MePersonalityController, PersonalityController } from './personality.controller';
import { PersonalityService } from './personality.service';

@Module({
  imports: [RecommendationsModule],
  controllers: [PersonalityController, MePersonalityController],
  providers: [PersonalityService],
  exports: [PersonalityService],
})
export class PersonalityModule {}
