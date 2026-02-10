require('dotenv').config({ path: '.env.local' });

const { kv } = require('@vercel/kv');
const fs = require('fs');

async function removeBikaner() {
  try {
    console.log('Removing Bikaner coins...\n');

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ Missing environment variables!');
      process.exit(1);
    }

    const coins = await kv.get('coins');

    if (!coins || !Array.isArray(coins)) {
      console.error('❌ No coins found in database');
      process.exit(1);
    }

    console.log(`Total coins before: ${coins.length}`);

    // Find Bikaner coins
    const bikanerCoins = coins.filter(c =>
      c.subsubsection && c.subsubsection.toLowerCase().includes('bikaner')
    );

    console.log(`\nFound ${bikanerCoins.length} Bikaner coins:`);
    bikanerCoins.forEach(coin => {
      console.log(`  - Index ${coin.index}: ${coin.subsubsection} (${coin.faceValue} ${coin.currency})`);
    });

    // Remove Bikaner coins
    const filteredCoins = coins.filter(c =>
      !c.subsubsection || !c.subsubsection.toLowerCase().includes('bikaner')
    );

    console.log(`\nTotal coins after: ${filteredCoins.length}`);

    if (bikanerCoins.length > 0) {
      // Save to database
      await kv.set('coins', filteredCoins);
      console.log('✓ Removed Bikaner coins from database');

      // Update local file
      fs.writeFileSync('coins-data.json', JSON.stringify(filteredCoins, null, 2));
      console.log('✓ Updated coins-data.json\n');
    } else {
      console.log('\n✓ No Bikaner coins found to remove\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

removeBikaner();
