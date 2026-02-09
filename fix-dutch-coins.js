require('dotenv').config({ path: '.env.local' });

const { kv } = require('@vercel/kv');

async function fixDutchCoins() {
  try {
    console.log('Fixing Dutch East India Company coins...\n');

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

    // Find Dutch coins
    const dutchCoins = coins.filter(coin =>
      coin.subsection === 'Dutch East India Company'
    );

    console.log(`Found ${dutchCoins.length} Dutch East India Company coins:\n`);

    dutchCoins.forEach(coin => {
      console.log(`  - Index ${coin.index}: issuer="${coin.issuer}", subsubsection="${coin.subsubsection}"`);
    });

    // Update all Dutch coins to have standardized issuer
    let updatedCount = 0;
    coins.forEach(coin => {
      if (coin.subsection === 'Dutch East India Company') {
        // Keep location info in notes if it exists in issuer
        if (coin.issuer.includes(' - ') && !coin.numberAndNotes) {
          const location = coin.issuer.split(' - ')[1];
          coin.numberAndNotes = `Location: ${location}`;
        }

        // Standardize issuer
        if (coin.issuer !== 'Dutch East India Company') {
          coin.issuer = 'Dutch East India Company';
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      // Save updated coins
      await kv.set('coins', coins);
      console.log(`\n✓ Updated ${updatedCount} coins`);
      console.log('✓ All Dutch East India Company coins now have the same issuer');
      console.log('✓ Location information preserved in notes where applicable\n');
    } else {
      console.log('\n✓ No updates needed - all coins already standardized\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixDutchCoins();
