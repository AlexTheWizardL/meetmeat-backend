import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for application exceptions with user-friendly messages
 */
export class AppException extends HttpException {
  constructor(
    message: string,
    code: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ message, code }, statusCode);
  }
}

/**
 * AI Service Exceptions
 */
export class AiServiceUnavailableException extends AppException {
  constructor(details?: string) {
    super(
      'AI service is temporarily unavailable. Please try again later.',
      'AI_SERVICE_UNAVAILABLE',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    if (details !== undefined && details !== '') {
      // Log details but don't expose to client
      console.error('AI Service Error:', details);
    }
  }
}

export class AiConfigurationException extends AppException {
  constructor() {
    super(
      'AI service is not properly configured. Please contact support.',
      'AI_NOT_CONFIGURED',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class AiRateLimitException extends AppException {
  constructor() {
    super(
      'AI service is busy. Please wait a moment and try again.',
      'AI_RATE_LIMITED',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Event Parsing Exceptions
 */
export class EventParsingException extends AppException {
  constructor(message?: string) {
    super(
      message ??
        'Could not extract event details from the provided URL. Please try entering details manually.',
      'EVENT_PARSING_FAILED',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class InvalidEventUrlException extends AppException {
  constructor() {
    super(
      'The provided URL is not valid or accessible. Please check the URL and try again.',
      'INVALID_EVENT_URL',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Resource Exceptions
 */
export class ResourceNotFoundException extends AppException {
  constructor(resource: string) {
    super(`${resource} not found.`, 'NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class ResourceAlreadyExistsException extends AppException {
  constructor(resource: string) {
    super(`${resource} already exists.`, 'ALREADY_EXISTS', HttpStatus.CONFLICT);
  }
}

/**
 * Validation Exceptions
 */
export class ValidationException extends AppException {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST);
  }
}

/**
 * Template Generation Exceptions
 */
export class TemplateGenerationException extends AppException {
  constructor() {
    super(
      'Could not generate poster templates. Please try again.',
      'TEMPLATE_GENERATION_FAILED',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Storage Exceptions
 */
export class StorageException extends AppException {
  constructor() {
    super(
      'Could not save file. Please try again.',
      'STORAGE_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Export Exceptions
 */
export class ExportException extends AppException {
  constructor() {
    super(
      'Could not export poster. Please try again.',
      'EXPORT_FAILED',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
