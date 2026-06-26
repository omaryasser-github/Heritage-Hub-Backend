import { BadRequestException } from '@nestjs/common';

export function assertExclusiveTarget(
  cityId: string | undefined,
  monumentId: string | undefined,
): { cityId?: string; monumentId?: string } {
  const hasCity = Boolean(cityId);
  const hasMonument = Boolean(monumentId);

  if (hasCity === hasMonument) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Exactly one of cityId or monumentId must be provided',
      details: { cityId: ['xor'], monumentId: ['xor'] },
    });
  }

  return { cityId, monumentId };
}
