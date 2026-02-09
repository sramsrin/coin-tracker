require('dotenv').config({ path: '.env.local' });

const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Starting migration...\n');

    // Check if environment variables are set
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ Missing environment variables!');
      console.error('Make sure .env.local exists with:');
      console.error('  - KV_REST_API_URL');
      console.error('  - KV_REST_API_TOKEN');
      console.error('\nGet these from: Vercel Dashboard → Storage → Your Redis → .env.local tab');
      process.exit(1);
    }

    // Read existing coins data
    const dataFile = path.join(__dirname, 'coins-data.json');

    if (!fs.existsSync(dataFile)) {
      console.error('❌ coins-data.json not found!');
      process.exit(1);
    }

    const data = fs.readFileSync(dataFile, 'utf-8');
    const coins = JSON.parse(data);

    console.log(`Found ${coins.length} coins to migrate...`);

    // Upload to Vercel KV
    await kv.set('coins', coins);

    console.log('\n✓ Successfully migrated coins to Vercel KV!');
    console.log(`✓ ${coins.length} coins uploaded`);

    // Verify the upload
    const uploaded = await kv.get('coins');
    console.log(`✓ Verified: ${uploaded ? uploaded.length : 0} coins in KV\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you created the Redis database in Vercel');
    console.error('2. Check that .env.local has the correct values from Vercel');
    console.error('3. Make sure coins-data.json exists\n');
    process.exit(1);
  }
}

migrate();
