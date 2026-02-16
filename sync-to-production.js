const fs = require('fs');
const https = require('https');

// Read coins from JSON file
const coinsData = JSON.parse(fs.readFileSync('./coins-data.json', 'utf8'));

console.log('What is your Vercel app URL?');
console.log('Example: your-app.vercel.app (without https://)');
console.log('\nRun this script with: node sync-to-production.js YOUR_DOMAIN');
console.log('Example: node sync-to-production.js coin-tracker-abc123.vercel.app\n');

const domain = process.argv[2];

if (!domain) {
  console.error('❌ Please provide your Vercel domain as an argument');
  process.exit(1);
}

const options = {
  hostname: domain,
  port: 443,
  path: '/api/migrate-coins',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify({ coins: coinsData }))
  }
};

console.log(`Syncing ${coinsData.length} coins to production at https://${domain}...`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('\nResponse:', data);
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! All coins with dates synced to production!');
    } else {
      console.log(`\n❌ Error: Status ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(JSON.stringify({ coins: coinsData }));
req.end();
