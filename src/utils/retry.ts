/**
 * Retry utilities with exponential backoff
 * For handling rate limits and transient errors
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on authentication errors or client errors (4xx)
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }

      // Don't retry on validation errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Retry specifically for rate limit errors (429)
 * Uses retry-after header if available
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum retry attempts
 * @returns Result of the function
 */
export async function retryRateLimit<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on rate limit errors
      if (error.response?.status !== 429) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Use retry-after header if available, otherwise use exponential backoff
      const retryAfter = error.response?.headers['retry-after'];
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : 1000 * Math.pow(2, attempt);

      console.warn(`Rate limit hit, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}
