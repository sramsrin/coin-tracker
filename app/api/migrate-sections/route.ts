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
      let changed = false;
      let newSubsection = coin.subsection;

      if (coin.subsection === 'Madurai') {
        newSubsection = 'Madurai Nayak';
        changed = true;
      } else if (coin.subsection === 'Tanjore') {
        newSubsection = 'Tanjore Nayak';
        changed = true;
      }

      if (changed) {
        updatedCount++;
        return { ...coin, subsection: newSubsection };
      }
      return coin;
    });

    if (updatedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      message: 'Subsection migration completed',
      updatedCount,
      totalCount: coins.length,
      availableSubsections: Array.from(new Set(updatedCoins.map(c => c.subsection))).filter(Boolean)
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
