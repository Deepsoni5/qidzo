import { Redis } from '@upstash/redis';

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const redis = redisClient;

export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600 // Default 1 hour
): Promise<T> {
  // Try fetch from Redis
  try {
    const cachedData = await redis.get<T>(key);
    if (cachedData) {
      console.log(`[REDIS] Cache HIT: ${key}`);
      return cachedData;
    }
  } catch (error) {
    console.error(`[REDIS] Error getting key ${key}:`, error);
  }

  // If missing or error, fetch fresh data
  console.log(`[REDIS] Cache MISS: ${key}`);
  const freshData = await fetchFn();

  // Save to Redis
  if (freshData) {
    try {
      await redis.set(key, freshData, { ex: ttl });
    } catch (error) {
      console.error(`[REDIS] Error setting key ${key}:`, error);
    }
  }

  return freshData;
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[REDIS] Invalidated keys: ${keys.join(', ')}`);
    }
  } catch (error) {
    console.error(`[REDIS] Error invalidating keys ${pattern}:`, error);
  }
}
