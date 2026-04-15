import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function GET() {
  try {
    const coins = await kv.get<any[]>(COINS_KEY);
    if (!coins) {
      return NextResponse.json({ message: 'No coins found' });
    }

    let updatedCount = 0;
    const updatedCoins = coins.map((coin) => {
      if (coin.section === 'Older Indian Kingdoms') {
        updatedCount++;
        return { ...coin, section: 'Peninsular India' };
      }
      return coin;
    });

    if (updatedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      message: 'Migration completed',
      updatedCount,
      totalCount: coins.length,
      availableSections: Array.from(new Set(coins.map(c => c.section))).filter(Boolean)
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
