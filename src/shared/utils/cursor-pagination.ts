import { BadRequestException } from '@nestjs/common';
import type { DataEnvelope } from '../interceptors/response.interceptor';

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export interface CursorPayload {
  id: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
  has_next: boolean;
}

export function resolveLimit(limit?: number): number {
  const resolved = limit ?? DEFAULT_PAGE_LIMIT;
  return Math.min(Math.max(resolved, 1), MAX_PAGE_LIMIT);
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as CursorPayload;

    if (!parsed?.id || !parsed?.created_at) {
      throw new Error('Invalid cursor payload');
    }

    const createdAt = new Date(parsed.created_at);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor timestamp');
    }

    return parsed;
  } catch {
    throw new BadRequestException({
      code: 'INVALID_CURSOR',
      message: 'Invalid pagination cursor',
    });
  }
}

export function buildPaginatedEnvelope<
  TSource extends { id: string; createdAt: Date },
  TItem,
>(
  rows: TSource[],
  limit: number,
  mapItem: (row: TSource) => TItem,
  getCursorId: (row: TSource) => string = (row) => row.id,
): DataEnvelope<TItem[]> {
  const hasNext = rows.length > limit;
  const pageRows = hasNext ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    data: pageRows.map(mapItem),
    ...(hasNext && lastRow
      ? {
          cursor: encodeCursor({
            id: getCursorId(lastRow),
            created_at: lastRow.createdAt.toISOString(),
          }),
          has_next: true,
        }
      : { has_next: false }),
  };
}

export type CursorFilter = {
  OR?: Array<
    { createdAt: { lt: Date } } | { AND: [{ createdAt: Date }, { id: { lt: string } }] }
  >;
};

export function cursorWhereClause(cursor: string | undefined): CursorFilter {
  if (!cursor) {
    return {};
  }

  const payload = decodeCursor(cursor);
  const createdAt = new Date(payload.created_at);

  return {
    OR: [
      { createdAt: { lt: createdAt } },
      { AND: [{ createdAt }, { id: { lt: payload.id } }] },
    ],
  };
}
