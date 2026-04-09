const Redis = require('ioredis');

let redis;

const connectRedis = () => {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️  Redis unavailable, continuing without cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
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
