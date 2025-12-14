import type { Logger } from '@nestjs/common';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** HTTP status codes that should trigger a retry (default: 429, 500, 502, 503, 504) */
  retryableStatusCodes?: number[];
  /** Logger instance for logging retry attempts */
  logger?: Logger;
  /** Context name for logging */
  context?: string;
}

const DEFAULT_RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

/**
 * Executes an async function with exponential backoff retry logic.
 * Useful for AI API calls that may experience rate limits or transient failures.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    retryableStatusCodes = DEFAULT_RETRYABLE_STATUS_CODES,
    logger,
    context = 'withRetry',
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (
        attempt >= maxRetries ||
        !isRetryableError(lastError, retryableStatusCodes)
      ) {
        throw lastError;
      }

      // Log retry attempt
      logger?.warn(
        `[${context}] Attempt ${String(attempt + 1)}/${String(maxRetries + 1)} failed: ${lastError.message}. Retrying in ${String(delay)}ms...`,
      );

      // Wait before next attempt
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error('Unexpected retry failure');
}

/**
 * Determines if an error is retryable based on status codes or error type
 */
function isRetryableError(
  error: Error,
  retryableStatusCodes: number[],
): boolean {
  // Check for HTTP status code in error message
  const statusMatch = /(\d{3})/.exec(error.message);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10);
    if (retryableStatusCodes.includes(statusCode)) {
      return true;
    }
  }

  // Rate limit errors
  if (error.message.toLowerCase().includes('rate limit')) {
    return true;
  }

  // Network errors
  if (
    error.message.includes('ECONNRESET') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('fetch failed')
  ) {
    return true;
  }

  return false;
}

/**
 * Sleep utility for delay between retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
