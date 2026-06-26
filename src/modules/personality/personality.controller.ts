import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { QuizSubmitDto } from './dto/quiz-submit.dto';
import { PersonalityService } from './personality.service';

@Controller('personality')
export class PersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

  @Get('quiz')
  getQuiz() {
    return this.personalityService.getQuiz();
  }

  @Post('quiz/submit')
  submitQuiz(@CurrentUser() user: AuthenticatedUser, @Body() dto: QuizSubmitDto) {
    return this.personalityService.submitQuiz(user.id, dto);
  }
}

@Controller('me/personality')
export class MePersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

  @Get()
  getPersonality(@CurrentUser() user: AuthenticatedUser) {
    return this.personalityService.getUserPersonality(user.id);
  }
}
