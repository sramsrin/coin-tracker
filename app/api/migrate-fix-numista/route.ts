import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

interface Coin {
  id: string;
  index: string;
  section: string;
  subsection: string;
  subsubsection: string;
  faceValue: string;
  currency: string;
  kmNumber: string;
  numistaNumber: string;
  numistaLink: string;
  weight: string;
  book: string;
  numberAndNotes: string;
  obverse: string;
  reverse: string;
}

// Fix 5 mismatched numistaNumber fields to match their numistaLink
const fixes: Record<string, string> = {
  '26605': '24627',
  '71241': '422395',
  '541': '1616',
  '542': '7305',
  '418952': '418592',
};

export async function POST() {
  try {
    const coins = await kv.get<Coin[]>(COINS_KEY);

    if (!coins || coins.length === 0) {
      return NextResponse.json({ message: 'No coins found', updated: 0 });
    }

    let updatedCount = 0;
    const updatedCoins = coins.map(coin => {
      if (fixes[coin.numistaNumber]) {
        updatedCount++;
        return {
          ...coin,
          numistaNumber: fixes[coin.numistaNumber]
        };
      }
      return coin;
    });

    if (updatedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      message: 'Migration completed successfully',
      updated: updatedCount,
      total: coins.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to fix Numista numbers' },
      { status: 500 }
    );
  }
}
