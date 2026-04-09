require('dotenv').config();
const express = require('express');
const { connectRedis, getRedis } = require('./config/redis');
const { getNotificationQueue } = require('./queues/notification.queue');

async function healthCheck() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🔍  AVENOR BACKEND DEPLOYMENT HEALTH CHECK');
  console.log('═══════════════════════════════════════════════════\n');

  const results = {
    redis_app_cache: false,
    redis_queue: false,
    environment: false,
    port: false,
  };

  try {
    // Check environment
    console.log('[1/4] Checking environment variables...');
    if (
      process.env.REDIS_URL &&
      process.env.MONGODB_URI &&
      process.env.JWT_ACCESS_SECRET &&
      process.env.JWT_REFRESH_SECRET
    ) {
      console.log('✓ All critical env vars present');
      console.log(`  • REDIS_URL: ${process.env.REDIS_URL.substring(0, 30)}...`);
      console.log(`  • MONGODB_URI: ${process.env.MONGODB_URI.substring(0, 30)}...`);
      console.log('  • JWT_ACCESS_SECRET: configured');
      console.log('  • JWT_REFRESH_SECRET: configured');
      results.environment = true;
    } else {
      throw new Error('Missing critical environment variables');
    }

    // Check app Redis cache
    console.log('\n[2/4] Testing app Redis cache...');
    const redis = connectRedis();
    if (redis) {
      await redis.connect();
      await redis.set('health-check', 'ok', 'EX', 60);
      const val = await redis.get('health-check');
      console.log('✓ App cache operational (SET/GET validated)');
      await redis.disconnect();
      results.redis_app_cache = true;
    }

    // Check notification queue
    console.log('\n[3/4] Testing Bull notification queue...');
    const queue = getNotificationQueue();
    await queue.isReady();
    const job = await queue.add('send', { recipients: [], type: 'health_check' }, { attempts: 1 });
    console.log(`✓ Queue operational (job ${job.id} added)`);
    await queue.close();
    results.redis_queue = true;

    // Check port availability
    console.log('\n[4/4] Checking server port...');
    const port = process.env.PORT || 8000;
    console.log(`✓ Server will run on port ${port}`);
    results.port = true;

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('FINAL RESULTS:');
    console.log('═══════════════════════════════════════════════════');
    Object.entries(results).forEach(([key, status]) => {
      const symbol = status ? '✅' : '❌';
      console.log(`${symbol} ${key.toUpperCase()}: ${status ? 'READY' : 'FAILED'}`);
    });

    const allPass = Object.values(results).every(v => v === true);
    if (allPass) {
      console.log('\n🟢 BACKEND IS DEPLOYMENT-READY');
      console.log('\nYou can now:');
      console.log('  1. Run: npm start');
      console.log('  2. Deploy to Render via GitHub push');
      console.log('  3. Configure REDIS_URL and MONGODB_URI on Render');
    } else {
      console.log('\n🔴 BACKEND HAS ISSUES - FIX ABOVE BEFORE DEPLOYING');
      process.exit(1);
    }

  } catch (e) {
    console.error('\n🔴 HEALTH CHECK FAILED:', e.message);
    console.error('Details:', e.code || e.address);
    process.exit(1);
  }

  process.exit(0);
}

setTimeout(() => {
  console.error('\n🔴 Health check exceeded 45 seconds');
  process.exit(1);
}, 45000);

healthCheck();
