require('dotenv').config({ path: '.env.local' });

const { kv } = require('@vercel/kv');
const fs = require('fs');

async function restoreBikaner() {
  try {
    console.log('Restoring Bikaner coin...\n');

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ Missing environment variables!');
      process.exit(1);
    }

    const coins = await kv.get('coins');

    if (!coins || !Array.isArray(coins)) {
      console.error('❌ No coins found in database');
      process.exit(1);
    }

    // The Bikaner coin data
    const bikanerCoin = {
      id: "153",
      index: "13.6",
      section: "Indian Princely States",
      subsection: "Rajputana Agency",
      subsubsection: "Bikaner",
      faceValue: "1",
      currency: "Takka",
      kmNumber: "23",
      numistaNumber: "48264",
      numistaLink: "https://en.numista.com/catalogue/pieces48264.html",
      weight: "Weight: 15.85 gms",
      book: "",
      numberAndNotes: "",
      obverse: "",
      reverse: ""
    };

    console.log('Adding coin:');
    console.log(`  Index: ${bikanerCoin.index}`);
    console.log(`  State: ${bikanerCoin.subsubsection}`);
    console.log(`  Value: ${bikanerCoin.faceValue} ${bikanerCoin.currency}`);

    // Add the coin back
    coins.push(bikanerCoin);

    // Sort by index
    coins.sort((a, b) => {
      const [aPage, aSlot] = a.index.split('.').map(Number);
      const [bPage, bSlot] = b.index.split('.').map(Number);
      if (aPage !== bPage) return aPage - bPage;
      return aSlot - bSlot;
    });

    console.log(`\nTotal coins: ${coins.length}`);

    // Save to database
    await kv.set('coins', coins);
    console.log('✓ Added Bikaner coin to database');

    // Update local file
    fs.writeFileSync('coins-data.json', JSON.stringify(coins, null, 2));
    console.log('✓ Updated coins-data.json\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

restoreBikaner();
