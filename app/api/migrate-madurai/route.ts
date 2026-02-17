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

    // Debug: Find all Madurai coins
    const maduraiCoins = coins.filter(coin =>
      coin.subsubsection === 'Madurai' ||
      coin.subsection === 'Madurai' ||
      (coin.section && coin.section.toLowerCase().includes('madurai'))
    );
    console.log('Found Madurai coins:', maduraiCoins);

    // Find and update Madurai coins
    let updatedCount = 0;
    const updatedCoins = coins.map(coin => {
      if (coin.subsubsection === 'Madurai' && coin.section === 'British India Princely States') {
        updatedCount++;
        return {
          ...coin,
          section: 'Other',
          subsection: 'Madurai',
          subsubsection: ''
        };
      }
      return coin;
    });

    // Save updated coins
    await kv.set(COINS_KEY, updatedCoins);

    return NextResponse.json({
      success: true,
      message: `Moved ${updatedCount} Madurai coins from "Annexed kingdoms" to "Other"`,
      updatedCount,
      foundMaduraiCoins: maduraiCoins.length,
      maduraiCoins: maduraiCoins.map(c => ({
        section: c.section,
        subsection: c.subsection,
        subsubsection: c.subsubsection
      }))
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}
