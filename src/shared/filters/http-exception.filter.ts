import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../interceptors/trace.interceptor';

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code, message, details } = this.mapException(exception);
    const requestId = this.resolveRequestId(request);

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorEnvelope = {
      error: {
        code,
        message,
        details,
      },
    };

    response.status(status).json(body);
  }

  private resolveRequestId(request: Request): string {
    if (request.requestId) {
      return request.requestId;
    }

    const header = request.headers[REQUEST_ID_HEADER];
    if (typeof header === 'string' && header.length > 0) {
      return header;
    }

    return 'unknown';
  }

  private mapException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          status,
          code: this.statusToCode(status),
          message: exceptionResponse,
          details: {},
        };
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const payload = exceptionResponse as Record<string, unknown>;
        const message = this.extractMessage(payload, exception.message);
        const details =
          payload.details && typeof payload.details === 'object'
            ? (payload.details as Record<string, unknown>)
            : this.extractValidationDetails(payload);

        return {
          status,
          code: typeof payload.code === 'string' ? payload.code : this.statusToCode(status),
          message,
          details,
        };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: {},
    };
  }

  private extractMessage(payload: Record<string, unknown>, fallback: string): string {
    if (typeof payload.message === 'string') {
      return payload.message;
    }

    if (Array.isArray(payload.message)) {
      return payload.message.map(String).join('; ');
    }

    return fallback;
  }

  private extractValidationDetails(payload: Record<string, unknown>): Record<string, unknown> {
    if (Array.isArray(payload.message)) {
      return { messages: payload.message };
    }

    return {};
  }

  private statusToCode(status: number): string {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 413) return 'PAYLOAD_TOO_LARGE';
    if (status === 429) return 'TOO_MANY_REQUESTS';
    if (status >= 500) return 'INTERNAL_SERVER_ERROR';
    return 'HTTP_ERROR';
  }
}
