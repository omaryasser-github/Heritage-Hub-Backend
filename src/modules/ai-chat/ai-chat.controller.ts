import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { PaginationQueryDto } from '../explore/dto/pagination.dto';
import { AiChatService } from './ai-chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat/sessions')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get()
  listSessions(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.aiChatService.listSessions(user.id, query.cursor, query.limit);
  }

  @Post()
  createSession(@CurrentUser() user: AuthenticatedUser) {
    return this.aiChatService.createSession(user.id);
  }

  @Get(':sessionId/messages')
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.aiChatService.listMessages(user.id, sessionId, query.cursor, query.limit);
  }

  @Post(':sessionId/messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiChatService.sendMessage(user.id, sessionId, dto.message);
  }
}
