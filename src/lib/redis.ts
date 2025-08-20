import Redis from 'ioredis';

// Skip Redis during build time
const isBuilding = process.env.SKIP_BUILD_REDIS === 'true';

// Create Redis instance immediately if not building
let redis: Redis;

if (isBuilding) {
  console.log('Skipping Redis connection during build');
  // Create a mock Redis that returns promises for all methods
  redis = new Proxy({} as Redis, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return () => Promise.resolve(null);
      }
      return undefined;
    }
  });
} else {
  // Create real Redis connection
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = parseInt(process.env.REDIS_DB || '0');

  console.log(
    `Initializing Redis connection to ${redisHost}:${redisPort} (DB: ${redisDb})`
  );

  redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDb,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    // Remove lazyConnect to establish connection immediately
    connectTimeout: 10000,
    commandTimeout: 5000
  });

  redis.on('connect', () => {
    console.log(`Redis connected successfully to ${redisHost}:${redisPort}`);
  });

  redis.on('error', (err) => {
    console.error(`Redis connection error (${redisHost}:${redisPort}):`, err);
  });

  redis.on('ready', () => {
    console.log(`Redis ready to accept commands at ${redisHost}:${redisPort}`);
  });

  redis.on('reconnecting', (delay: number) => {
    console.log(`Redis reconnecting in ${delay}ms`);
  });
}

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
  SEARCH: 300, // 5 minutes
  USER_DATA: 86400 * 7 // 7 days
};
