const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// ── Redis Connection ───────────────────────────────────────────────────────────
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisConnection.on('connect', () => console.log('✅ Redis connected'));
redisConnection.on('error', (err) => console.error('❌ Redis error:', err.message));

// ── Queue Definitions ──────────────────────────────────────────────────────────
const emailQueue = new Queue('email', { connection: redisConnection });
const notificationQueue = new Queue('notification', { connection: redisConnection });

/**
 * Add a job to the email queue.
 * @param {object} jobData - { to, subject, html, text }
 */
const addEmailJob = async (jobData) => {
  await emailQueue.add('send-email', jobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
};

/**
 * Add a job to the notification queue.
 * @param {object} jobData - { userId, tenantId, message, type }
 */
const addNotificationJob = async (jobData) => {
  await notificationQueue.add('push-notification', jobData, { attempts: 2 });
};

module.exports = { redisConnection, emailQueue, notificationQueue, addEmailJob, addNotificationJob };
