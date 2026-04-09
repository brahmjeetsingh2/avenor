const Bull = require('bull');

let notificationQueue = null;

const getNotificationQueue = () => {
  if (notificationQueue) return notificationQueue;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const isUpstash = redisUrl.includes('upstash') || redisUrl.startsWith('rediss://');

  notificationQueue = new Bull('notifications', {
    redis: isUpstash ? { url: redisUrl, tls: {} } : redisUrl,
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