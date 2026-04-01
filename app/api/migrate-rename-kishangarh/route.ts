import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST() {
  try {
    const coins = await kv.get<any[]>(COINS_KEY);
    if (!coins || !Array.isArray(coins)) {
      return NextResponse.json({ error: 'No coins found' }, { status: 404 });
    }

    let updatedCount = 0;
    const updatedCoins = coins.map(coin => {
      let changed = false;
      if (coin.subsection === 'Kishangarh') {
        coin.subsection = 'Kishangarh/Jaipur';
        changed = true;
      }
      if (coin.subsubsection === 'Kishangarh') {
        coin.subsubsection = 'Kishangarh/Jaipur';
        changed = true;
      }
      if (changed) updatedCount++;
      return coin;
    });

    if (updatedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Successfully renamed Kishangarh to Kishangarh/Jaipur in ${updatedCount} coins.`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 });
  }
}
