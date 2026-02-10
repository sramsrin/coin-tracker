require('dotenv').config({ path: '.env.local' });

const { kv } = require('@vercel/kv');
const fs = require('fs');

async function removeIssuerField() {
  try {
    console.log('Removing issuer field from all coins...\n');

    // Check environment variables
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ Missing environment variables!');
      process.exit(1);
    }

    // Get all coins
    const coins = await kv.get('coins');

    if (!coins || !Array.isArray(coins)) {
      console.error('❌ No coins found in database');
      process.exit(1);
    }

    console.log(`Total coins: ${coins.length}`);

    // Remove issuer field from all coins
    const updatedCoins = coins.map(coin => {
      const { issuer, ...coinWithoutIssuer } = coin;
      return coinWithoutIssuer;
    });

    // Save updated coins to database
    await kv.set('coins', updatedCoins);
    console.log('✓ Removed issuer field from all coins in database');

    // Update local coins-data.json
    fs.writeFileSync('coins-data.json', JSON.stringify(updatedCoins, null, 2));
    console.log('✓ Updated coins-data.json\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

removeIssuerField();
