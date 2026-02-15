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

// GET - Migrate section name from old to new
export async function GET() {
  try {
    const coins = await kv.get<Coin[]>(COINS_KEY);

    if (!coins || coins.length === 0) {
      return NextResponse.json({
        message: 'No coins found in database',
        updated: 0
      });
    }

    let updatedCount = 0;
    const updatedCoins = coins.map(coin => {
      if (coin.section === 'European Colonial Powers in India') {
        updatedCount++;
        return {
          ...coin,
          section: 'European Trading Companies'
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
      { error: 'Failed to migrate section names' },
      { status: 500 }
    );
  }
}
