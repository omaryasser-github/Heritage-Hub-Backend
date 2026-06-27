import { Injectable, Logger } from '@nestjs/common';
import { TourbotChatClient } from './tourbot-chat.types';

@Injectable()
export class TourbotChatStubClient implements TourbotChatClient {
  private readonly logger = new Logger(TourbotChatStubClient.name);

  constructor() {
    this.logger.log('Using TourBot chat stub client');
  }

  async sendMessage(sessionId: string, message: string): Promise<string> {
    void sessionId;
    const trimmed = message.trim();

    return trimmed
      ? `Heritage Hub (stub): I received "${trimmed.slice(0, 120)}". Connect TourBot with AI_CHAT_USE_STUB=false.`
      : 'Heritage Hub (stub): How can I help you explore Egypt?';
  }
}
