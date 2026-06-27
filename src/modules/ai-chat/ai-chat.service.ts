import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatMessageRole } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import type { DataEnvelope } from '../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  decodeCursor,
  resolveLimit,
} from '../../shared/utils/cursor-pagination';
import { CHAT_FALLBACK_REPLY, TOURBOT_CHAT_CLIENT } from './ai-chat.constants';
import type { TourbotChatClient } from './clients/tourbot-chat.types';

export interface ChatSessionResponse {
  id: string;
  started_at: string;
  last_active_at: string;
}

export interface ChatMessageResponse {
  id: string;
  role: ChatMessageRole;
  content: string;
  created_at: string;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOURBOT_CHAT_CLIENT) private readonly tourbotClient: TourbotChatClient,
  ) {}

  async listSessions(
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<ChatSessionResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const where: { userId: string; OR?: Array<{ startedAt: { lt: Date } } | { AND: [{ startedAt: Date }, { id: { lt: string } }] }> } = {
      userId,
    };

    if (cursor) {
      const payload = decodeCursor(cursor);
      const startedAt = new Date(payload.created_at);
      where.OR = [
        { startedAt: { lt: startedAt } },
        { AND: [{ startedAt }, { id: { lt: payload.id } }] },
      ];
    }

    const rows = await this.prisma.chatSession.findMany({
      where,
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(
      rows.map((session) => ({ ...session, createdAt: session.startedAt })),
      resolveLimit(limit),
      (session) => ({
        id: session.id,
        started_at: session.startedAt.toISOString(),
        last_active_at: session.lastActiveAt.toISOString(),
      }),
    );
  }

  async createSession(userId: string): Promise<ChatSessionResponse> {
    const session = await this.prisma.chatSession.create({ data: { userId } });
    return {
      id: session.id,
      started_at: session.startedAt.toISOString(),
      last_active_at: session.lastActiveAt.toISOString(),
    };
  }

  async listMessages(
    userId: string,
    sessionId: string,
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<ChatMessageResponse[]>> {
    await this.assertSession(userId, sessionId);

    const take = resolveLimit(limit) + 1;
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId, ...cursorWhereClause(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(limit), (message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      created_at: message.createdAt.toISOString(),
    }));
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
  ): Promise<ChatMessageResponse> {
    await this.assertSession(userId, sessionId);

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: ChatMessageRole.user,
        content: message,
      },
    });

    let assistantContent = CHAT_FALLBACK_REPLY;
    try {
      assistantContent = await this.tourbotClient.sendMessage(sessionId, message);
    } catch (error) {
      this.logger.warn(
        `TourBot chat failed for session ${sessionId}`,
        error instanceof Error ? error.message : String(error),
      );
    }

    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: ChatMessageRole.assistant,
        content: assistantContent,
      },
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });

    return {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      created_at: assistantMessage.createdAt.toISOString(),
    };
  }

  private async assertSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Chat session not found' });
    }
  }
}
