import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TourbotChatClient, TourbotChatResponse } from './tourbot-chat.types';

@Injectable()
export class TourbotChatHttpClient implements TourbotChatClient {
  private readonly logger = new Logger(TourbotChatHttpClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService
      .get<string>('aiChat.url', 'http://localhost:8000')
      .replace(/\/$/, '');
    this.timeoutMs = configService.get<number>('aiChat.timeoutMs', 30_000);
    this.logger.log(`TourBot chat client configured for ${this.baseUrl}`);
  }

  async sendMessage(sessionId: string, message: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post<TourbotChatResponse>(
        `${this.baseUrl}/chat`,
        {
          message,
          session_id: sessionId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: this.timeoutMs,
        },
      ),
    );

    return response.data.answer;
  }
}
