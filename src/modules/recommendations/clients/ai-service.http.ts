import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  AiChatRequest,
  AiChatResponse,
  AiRecommendationsRequest,
  AiRecommendationsResponse,
  AiServiceClient,
} from './ai-service.types';

@Injectable()
export class AiServiceHttpClient implements AiServiceClient {
  private readonly logger = new Logger(AiServiceHttpClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('aiService.url', 'http://localhost:8000');
    this.apiKey = configService.get<string>('aiService.apiKey', '');
    this.timeoutMs = configService.get<number>('aiService.timeoutMs', 5000);
    this.logger.log(`AI HTTP client configured for ${this.baseUrl}`);
  }

  async getRecommendations(request: AiRecommendationsRequest): Promise<AiRecommendationsResponse> {
    const response = await firstValueFrom(
      this.httpService.post<AiRecommendationsResponse>(
        `${this.baseUrl}/v1/recommendations`,
        request,
        this.requestConfig(),
      ),
    );
    return response.data;
  }

  async getChatCompletion(request: AiChatRequest): Promise<AiChatResponse> {
    const response = await firstValueFrom(
      this.httpService.post<AiChatResponse>(
        `${this.baseUrl}/v1/chat/completions`,
        request,
        this.requestConfig(),
      ),
    );
    return response.data;
  }

  private requestConfig() {
    return {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: this.timeoutMs,
    };
  }
}
