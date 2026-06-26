import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import type { DataEnvelope } from '../../shared/interceptors/response.interceptor';
import {
  buildPaginatedEnvelope,
  cursorWhereClause,
  resolveLimit,
} from '../../shared/utils/cursor-pagination';

export interface NotificationResponse {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  source_id: string | null;
  created_at: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<DataEnvelope<NotificationResponse[]>> {
    const take = resolveLimit(limit) + 1;
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...cursorWhereClause(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    return buildPaginatedEnvelope(rows, resolveLimit(limit), (row) => this.toResponse(row));
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Notification not found' });
    }

    if (notification.isRead) {
      return this.toResponse(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return this.toResponse(updated);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  private toResponse(notification: Notification): NotificationResponse {
    return {
      id: notification.id,
      notification_type: notification.notificationType,
      title: notification.title,
      body: notification.body,
      is_read: notification.isRead,
      source_id: notification.sourceId,
      created_at: notification.createdAt.toISOString(),
    };
  }
}
