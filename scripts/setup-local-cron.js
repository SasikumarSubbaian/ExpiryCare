#!/usr/bin/env node

/**
 * Local Development Cron Job for Reminder Emails
 * 
 * This script runs the reminder API endpoint at regular intervals.
 * For production, use Vercel Cron or an external cron service.
 * 
 * Usage:
 *   node scripts/setup-local-cron.js
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "cron": "node scripts/setup-local-cron.js"
 *   }
 */

const http = require('http');
const https = require('https');

const REMINDER_URL = process.env.REMINDER_URL || 'http://localhost:3001/api/reminders';
const INTERVAL_MINUTES = parseInt(process.env.REMINDER_INTERVAL_MINUTES || '60', 10); // Default: 1 hour
const ENABLED = process.env.ENABLE_LOCAL_CRON !== 'false'; // Default: enabled

function callReminderAPI() {
  const url = new URL(REMINDER_URL);
  const client = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': 'ExpiryCare-LocalCron/1.0',
    },
  };

  const req = client.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log(`[${new Date().toISOString()}] Reminder API called:`, {
          status: res.statusCode,
          reminders_sent: result.reminders_sent || 0,
          reminders_found: result.reminders_found || 0,
        });
      } catch (err) {
        console.log(`[${new Date().toISOString()}] Reminder API called:`, {
          status: res.statusCode,
          response: data.substring(0, 100),
        });
      }
    });
  });

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error calling reminder API:`, error.message);
  });

  req.end();
}

if (!ENABLED) {
  console.log('Local cron is disabled. Set ENABLE_LOCAL_CRON=true to enable.');
  process.exit(0);
}

console.log(`Starting local reminder cron job...`);
console.log(`URL: ${REMINDER_URL}`);
console.log(`Interval: ${INTERVAL_MINUTES} minutes`);
console.log(`Press Ctrl+C to stop\n`);

// Call immediately on start
callReminderAPI();

// Then call at regular intervals
const interval = setInterval(callReminderAPI, INTERVAL_MINUTES * 60 * 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping local cron job...');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nStopping local cron job...');
  clearInterval(interval);
  process.exit(0);
});

