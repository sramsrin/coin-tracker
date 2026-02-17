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

    // Find and update Madurai coins
    let updatedCount = 0;
    const updatedCoins = coins.map(coin => {
      if (coin.subsubsection === 'Madurai' && coin.subsection === 'Annexed kingdoms') {
        updatedCount++;
        return {
          ...coin,
          subsection: 'Other'
        };
      }
      return coin;
    });

    // Save updated coins
    await kv.set(COINS_KEY, updatedCoins);

    return NextResponse.json({
      success: true,
      message: `Moved ${updatedCount} Madurai coins from "Annexed kingdoms" to "Other"`,
      updatedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}
