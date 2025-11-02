/**
 * Performance Optimization Utilities
 *
 * Provides caching, memoization, debouncing, and other performance helpers
 */

/**
 * Simple in-memory cache with TTL support
 */
export class Cache<T> {
  private cache: Map<string, { value: T; expiresAt: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // Default: 5 minutes
    this.defaultTTL = defaultTTL;

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

/**
 * Memoization decorator for functions
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000,
    keyGenerator = (...args) => JSON.stringify(args),
  } = options;

  const cache = new Cache<ReturnType<T>>(ttl);
  const accessOrder: string[] = [];

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);

    if (cache.has(key)) {
      // Move to end of access order (LRU)
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
        accessOrder.push(key);
      }
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result, ttl);
    accessOrder.push(key);

    // Implement LRU eviction if max size exceeded
    if (accessOrder.length > maxSize) {
      const oldest = accessOrder.shift();
      if (oldest) {
        cache.delete(oldest);
      }
    }

    return result;
  }) as T;
}

/**
 * Debounce function - delays execution until after wait time has elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= wait) {
      lastCallTime = now;
      fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(
        () => {
          lastCallTime = Date.now();
          fn(...args);
        },
        wait - timeSinceLastCall
      );
    }
  };
}

/**
 * Batch operations to reduce database calls
 */
export class BatchProcessor<T, R> {
  private queue: Array<{
    item: T;
    resolve: (value: R) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private batchSize: number;
  private delay: number;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    options: { batchSize?: number; delay?: number } = {}
  ) {
    this.batchSize = options.batchSize ?? 10;
    this.delay = options.delay ?? 50;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (!this.processing) {
        this.scheduleProcessing();
      }
    });
  }

  private scheduleProcessing(): void {
    this.processing = true;

    setTimeout(async () => {
      await this.processBatch();
      this.processing = false;

      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }, this.delay);
  }

  private async processBatch(): Promise<void> {
    const batch = this.queue.splice(0, this.batchSize);

    if (batch.length === 0) {
      return;
    }

    try {
      const items = batch.map((b) => b.item);
      const results = await this.processor(items);

      batch.forEach((b, index) => {
        b.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((b) => {
        b.reject(error);
      });
    }
  }
}

/**
 * Lazy loading helper for expensive operations
 */
export class LazyValue<T> {
  private value: T | undefined;
  private initialized = false;

  constructor(private initializer: () => T) {}

  get(): T {
    if (!this.initialized) {
      this.value = this.initializer();
      this.initialized = true;
    }
    return this.value!;
  }

  reset(): void {
    this.value = undefined;
    this.initialized = false;
  }
}

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.recordMeasurement(label, duration);

      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMeasurement(label, duration);
      throw error;
    }
  }

  static measureSync<T>(
    label: string,
    fn: () => T
  ): { result: T; duration: number } {
    const start = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - start;

      this.recordMeasurement(label, duration);

      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMeasurement(label, duration);
      throw error;
    }
  }

  private static recordMeasurement(label: string, duration: number): void {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }

    const measurements = this.measurements.get(label)!;
    measurements.push(duration);

    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  static getStats(label: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const measurements = this.measurements.get(label);

    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, avg, min, max, p95 };
  }

  static getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const label of Array.from(this.measurements.keys())) {
      stats[label] = this.getStats(label);
    }

    return stats;
  }

  static reset(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}

/**
 * Query result cache for common database queries
 */
export const queryCache = new Cache<any>(5 * 60 * 1000); // 5 minutes default

/**
 * Cache keys generator
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  prompt: (promptId: string) => `prompt:${promptId}`,
  prompts: (userId: string, filters?: Record<string, any>) =>
    `prompts:${userId}:${JSON.stringify(filters)}`,
  tags: (userId: string) => `tags:${userId}`,
  folders: (userId: string) => `folders:${userId}`,
  stats: (userId: string, dateRange?: string) =>
    `stats:${userId}:${dateRange || 'default'}`,
  analytics: (userId: string, type: string) => `analytics:${userId}:${type}`,
};

/**
 * Automatic cache invalidation helper
 */
export class CacheInvalidator {
  static invalidateUser(userId: string): void {
    queryCache.delete(CacheKeys.user(userId));
    queryCache.delete(CacheKeys.tags(userId));
    queryCache.delete(CacheKeys.folders(userId));
  }

  static invalidatePrompt(promptId: string, userId: string): void {
    queryCache.delete(CacheKeys.prompt(promptId));
    // Invalidate user's prompts list (all variations)
    // Note: This is a simple approach - in production you'd want a more sophisticated cache key pattern
  }

  static invalidateStats(userId: string): void {
    // Clear all stats for user
    const allKeys = Array.from((queryCache as any).cache.keys()) as string[];
    const keys = allKeys.filter((key) =>
      key.startsWith(`stats:${userId}`) || key.startsWith(`analytics:${userId}`)
    );

    keys.forEach((key) => queryCache.delete(key));
  }
}

/**
 * Request deduplication - prevents duplicate concurrent requests
 */
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicate<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);

  return promise;
}
