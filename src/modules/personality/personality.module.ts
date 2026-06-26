import { Module } from '@nestjs/common';
import { MePersonalityController, PersonalityController } from './personality.controller';
import { PersonalityService } from './personality.service';

@Module({
  controllers: [PersonalityController, MePersonalityController],
  providers: [PersonalityService],
  exports: [PersonalityService],
})
export class PersonalityModule {}
