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
      if (coin.section === 'European Overseas' || coin.section === 'Delhi Sultanate') {
        updatedCount++;
        return { ...coin, section: 'Other' };
      }
      return coin;
    });

    if (updatedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      message: 'Migration completed',
      updatedCount,
      totalCount: coins.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
