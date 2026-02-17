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
  date: string;
}

export async function POST() {
  try {
    // Read all coins
    const coins = await kv.get<Coin[]>(COINS_KEY) || [];

    if (coins.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No coins found in database'
      });
    }

    let renamedCount = 0;

    const updatedCoins = coins.map(coin => {
      if (coin.section === 'Indian Kingdoms') {
        renamedCount++;
        return {
          ...coin,
          section: 'Older Indian Kingdoms'
        };
      }
      return coin;
    });

    // Save updated coins
    await kv.set(COINS_KEY, updatedCoins);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      details: {
        totalCoins: coins.length,
        renamedToOlderIndianKingdoms: renamedCount
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
