import Redis from 'ioredis';

// Skip Redis during build time
const isBuilding = process.env.SKIP_BUILD_REDIS === 'true';

// Lazy Redis connection - only connect when first used
let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    // During build, return a mock Redis that does nothing
    if (isBuilding) {
      console.log('Skipping Redis connection during build');
      return new Proxy({} as Redis, {
        get() {
          return () => Promise.resolve(null);
        }
      });
    }

    redisInstance = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true // Don't connect immediately
    });

    redisInstance.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisInstance.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  return redisInstance;
}

// Export a proxy that creates connection on first use
const redis = new Proxy({} as Redis, {
  get(target, prop, receiver) {
    const instance = getRedis();
    return Reflect.get(instance, prop, instance);
  }
});

export default redis;

export const REDIS_KEYS = {
  FILES: 'excel:files',
  FILE_INFO: (fileName: string) => `excel:file:${fileName}:info`,
  FILE_SHEETS: (fileName: string) => `excel:file:${fileName}:sheets`,
  FILE_CACHE_STATUS: (fileName: string) =>
    `excel:file:${fileName}:cache_status`,
  SHEET_INFO: (fileName: string, sheetName: string) =>
    `excel:sheet:${fileName}:${sheetName}:info`,
  SHEET_DATA: (fileName: string, sheetName: string, page: number) =>
    `excel:sheet:${fileName}:${sheetName}:data:${page}`,
  SHEET_TOTAL: (fileName: string, sheetName: string) =>
    `excel:sheet:${fileName}:${sheetName}:total`,
  SEARCH_INDEX: 'excel:search:index',
  LAST_UPDATE: 'excel:last_update',
  CACHE_STATUS: (taskId: string) => `excel:cache:status:${taskId}`,
  CACHE_PROGRESS: (taskId: string) => `excel:cache:progress:${taskId}`,
  CACHE_GLOBAL_STATUS: 'excel:cache:global_status'
};

export const CACHE_TTL = {
  DEFAULT: 3600, // 1 hour
  SHEET_DATA: 1800, // 30 minutes
  SEARCH: 300 // 5 minutes
};
