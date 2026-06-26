import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { InteractionBatchDto } from './dto/interaction-batch.dto';
import { InteractionsService } from './interactions.service';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  submitBatch(@CurrentUser() user: AuthenticatedUser, @Body() dto: InteractionBatchDto) {
    return this.interactionsService.submitBatch(user.id, dto);
  }
}
