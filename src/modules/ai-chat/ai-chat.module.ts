import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TOURBOT_CHAT_CLIENT } from './ai-chat.constants';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { TourbotChatHttpClient } from './clients/tourbot-chat.http';
import { TourbotChatStubClient } from './clients/tourbot-chat.stub';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    TourbotChatHttpClient,
    TourbotChatStubClient,
    {
      provide: TOURBOT_CHAT_CLIENT,
      inject: [ConfigService, TourbotChatHttpClient, TourbotChatStubClient],
      useFactory: (
        configService: ConfigService,
        httpClient: TourbotChatHttpClient,
        stubClient: TourbotChatStubClient,
      ) => {
        const useStub = isTestEnv || configService.get<boolean>('aiChat.useStub', false);
        return useStub ? stubClient : httpClient;
      },
    },
  ],
})
export class AiChatModule {}
