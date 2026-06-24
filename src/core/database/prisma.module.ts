import { Global, Module } from '@nestjs/common';

/**
 * Placeholder for Prisma client wiring (ADR-002).
 * Expanded in Phase 1 with schema, migrations, and PrismaService.
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class PrismaModule {}
