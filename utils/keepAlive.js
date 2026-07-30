const cron = require('node-cron');
const https = require('https');
const http = require('http');

const startKeepAlive = () => {
  const url = process.env.SERVER_URL;
  if (!url) {
    console.log('SERVER_URL not provided, keepAlive cron job not started.');
    return;
  }

  // Render spins down free web services after 15 minutes of inactivity.
  // Pinging every 14 minutes will prevent it from sleeping.
  cron.schedule('*/14 * * * *', () => {
    console.log(`[KeepAlive] Pinging ${url} to prevent cold boot...`);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      console.log(`[KeepAlive] Ping response status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`[KeepAlive] Ping failed:`, err.message);
    });
  });
};

module.exports = startKeepAlive;
