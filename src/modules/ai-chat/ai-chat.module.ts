import { Module } from '@nestjs/common';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

@Module({
  imports: [RecommendationsModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
