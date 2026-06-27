import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimitGuard } from '../../shared/guards/rate-limit.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url', 'redis://localhost:6379');
        const redisEnabled = configService.get<boolean>('redis.enabled', false);

        return {
          throttlers: [
            {
              name: 'default',
              ttl: configService.get<number>('throttle.defaultTtlMs', 60_000),
              limit: configService.get<number>('throttle.defaultLimit', 60),
            },
            {
              name: 'auth',
              ttl: configService.get<number>('throttle.authTtlMs', 60_000),
              limit: configService.get<number>('throttle.authLimit', 10),
            },
          ],
          storage: redisEnabled ? new ThrottlerStorageRedisService(redisUrl) : undefined,
        };
      },
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppThrottlerModule {}
