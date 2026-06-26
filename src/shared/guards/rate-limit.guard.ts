import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as Record<string, string | string[] | undefined> | undefined;
    const forwarded = headers?.['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    const ip = (req as { ip?: string }).ip;
    if (typeof ip === 'string' && ip.length > 0) {
      return ip;
    }

    const remoteAddress = (req as { socket?: { remoteAddress?: string } }).socket?.remoteAddress;
    return remoteAddress ?? 'unknown';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    void context;
    void throttlerLimitDetail;

    throw new HttpException(
      {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests',
        details: {},
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
