import type { Logger } from '@nestjs/common';
import { withRetry } from '../retry';

describe('withRetry', () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const resultPromise = withRetry(fn, { maxRetries: 3 });
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit error (429)', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('API error: 429 - Rate limited'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      logger: mockLogger,
      context: 'Test',
    });

    // Fast-forward past the delay
    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('should retry on server error (500)', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('API error: 500 - Server error'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
    });

    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries exhausted', async () => {
    jest.useRealTimers(); // Use real timers for this test

    const fn = jest
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error('API error: 500 - Server error')),
      );

    await expect(
      withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 10, // Short delay for faster test
      }),
    ).rejects.toThrow('API error: 500 - Server error');

    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries

    jest.useFakeTimers(); // Restore fake timers
  });

  it('should not retry on non-retryable error (400)', async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(new Error('API error: 400 - Bad request'));

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow(
      'API error: 400 - Bad request',
    );

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('API error: 503'))
      .mockRejectedValueOnce(new Error('API error: 503'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    });

    // First retry after 100ms
    await jest.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry after 200ms (exponential backoff)
    await jest.advanceTimersByTimeAsync(200);

    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelayMs cap', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('API error: 503'))
      .mockRejectedValueOnce(new Error('API error: 503'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 1500,
      backoffMultiplier: 2,
    });

    // First retry after 1000ms
    await jest.advanceTimersByTimeAsync(1000);

    // Second retry should be capped at 1500ms (not 2000ms)
    await jest.advanceTimersByTimeAsync(1500);

    const result = await resultPromise;
    expect(result).toBe('success');
  });

  it('should retry on network errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
    });

    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on rate limit message', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
    });

    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;
    expect(result).toBe('success');
  });

  it('should use default options when none provided', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
