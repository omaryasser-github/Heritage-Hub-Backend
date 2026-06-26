import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';

const bullImports = isTestEnv
  ? []
  : [
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
    ];

@Global()
@Module({
  imports: bullImports,
  exports: bullImports,
})
export class AppBullModule {}
