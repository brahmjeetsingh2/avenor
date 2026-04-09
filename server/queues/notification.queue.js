const Bull = require('bull');
const IORedis = require('ioredis');

let notificationQueue = null;

const getNotificationQueue = () => {
  if (notificationQueue) return notificationQueue;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const isUpstash = redisUrl.includes('upstash') || redisUrl.startsWith('rediss://');
  const redisOptions = isUpstash
    ? {
        tls: {},
        family: 4,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: true,
        connectTimeout: 15000,
      }
    : {};

  notificationQueue = new Bull('notifications', {
    createClient: (type) => {
      const isSubscriber = type === 'subscriber';
      return new IORedis(redisUrl, {
        ...redisOptions,
        ...(isSubscriber ? { maxRetriesPerRequest: null } : {}),
      });
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  notificationQueue.on('error', (err) => {
    console.warn('⚠️  Notification queue error (non-fatal):', err.message);
  });

  notificationQueue.on('failed', (job, err) => {
    console.warn(`⚠️  Notification job ${job.id} failed:`, err.message);
  });

  return notificationQueue;
};

module.exports = { getNotificationQueue };