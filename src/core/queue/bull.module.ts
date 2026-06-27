import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { isRedisEnabled } from '../redis/redis-enabled';

const bullImports = isRedisEnabled()
  ? [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connection: {
            url: configService.get<string>('redis.url', 'redis://localhost:6379'),
            maxRetriesPerRequest: null,
            lazyConnect: true,
          },
        }),
      }),
    ]
  : [];

@Global()
@Module({
  imports: bullImports,
  exports: bullImports,
})
export class AppBullModule {}
