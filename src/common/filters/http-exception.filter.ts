import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Catches all exceptions and returns user-friendly error messages.
 * Technical details are logged but not exposed to clients.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again later.';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        if (typeof resp.message === 'string') {
          message = resp.message;
        }
        if (typeof resp.code === 'string') {
          code = resp.code;
        } else {
          code = this.getCodeFromStatus(status);
        }
      }
    } else if (exception instanceof Error) {
      // Log the actual error for debugging
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );

      // Map common error patterns to user-friendly messages
      message = this.mapErrorToUserMessage(exception);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        statusCode: status,
      },
    });
  }

  private getCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };
    return statusCodes[status] ?? 'INTERNAL_ERROR';
  }

  private mapErrorToUserMessage(error: Error): string {
    const msg = error.message.toLowerCase();

    // AI/API errors
    if (
      msg.includes('api key') ||
      msg.includes('apikey') ||
      msg.includes('unauthorized')
    ) {
      return 'AI service is not properly configured. Please contact support.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'The request timed out. Please try again.';
    }
    if (
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound')
    ) {
      return 'Network error. Please check your connection and try again.';
    }

    // Database errors
    if (msg.includes('duplicate') || msg.includes('unique constraint')) {
      return 'This item already exists.';
    }
    if (msg.includes('foreign key') || msg.includes('reference')) {
      return 'Cannot complete this action due to related data.';
    }

    // Validation errors
    if (msg.includes('invalid') || msg.includes('validation')) {
      return 'Invalid data provided. Please check your input.';
    }

    // Default
    return 'Something went wrong. Please try again later.';
  }
}
