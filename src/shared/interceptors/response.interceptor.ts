import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DataEnvelope<T = unknown> {
  data: T;
  cursor?: string;
  has_next?: boolean;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<DataEnvelope> {
    return next.handle().pipe(
      map((body: unknown) => {
        if (this.isEnvelope(body)) {
          return body;
        }

        return { data: body };
      }),
    );
  }

  private isEnvelope(body: unknown): body is DataEnvelope {
    if (typeof body !== 'object' || body === null) {
      return false;
    }

    return 'data' in body;
  }
}
