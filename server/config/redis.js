const Redis = require('ioredis');

let redis;

const connectRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isUpstash = redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://');

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: isUpstash ? null : 3,
      enableReadyCheck: !isUpstash,
      enableOfflineQueue: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️  Redis unavailable, continuing without cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      ...(isUpstash ? { tls: {}, family: 4, commandTimeout: 15000, connectTimeout: 15000 } : {}),
    });

    redis.on('connect', () => console.log('✅ Redis Connected'));
    redis.on('error', (err) => console.warn('⚠️  Redis error (non-fatal):', err.message));

    return redis;
  } catch (error) {
    console.warn('⚠️  Redis init failed (non-fatal):', error.message);
    return null;
  }
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };
