const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    // Read existing coins data
    const dataFile = path.join(__dirname, 'coins-data.json');
    const data = fs.readFileSync(dataFile, 'utf-8');
    const coins = JSON.parse(data);

    console.log(`Found ${coins.length} coins to migrate...`);

    // Upload to Vercel KV
    await kv.set('coins', coins);

    console.log('✓ Successfully migrated coins to Vercel KV!');
    console.log(`✓ ${coins.length} coins uploaded`);

    // Verify the upload
    const uploaded = await kv.get('coins');
    console.log(`✓ Verified: ${uploaded.length} coins in KV`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
