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
    let movedCount = 0;

    const updatedCoins = coins.map(coin => {
      let updated = { ...coin };

      // 1. Rename "Annexed Kingdoms" to "Indian Kingdoms"
      if (updated.section === 'Annexed Kingdoms') {
        updated.section = 'Indian Kingdoms';
        renamedCount++;
      }

      // 2. Move Delhi Sultanate from "Other" to "Indian Kingdoms"
      if (updated.section === 'Other' && updated.subsection === 'Delhi Sultanate') {
        updated.section = 'Indian Kingdoms';
        movedCount++;
      }

      // 3. Move Chola Dynasty from "Other" to "Indian Kingdoms"
      if (updated.section === 'Other' && updated.subsection === 'Chola Dynasty') {
        updated.section = 'Indian Kingdoms';
        movedCount++;
      }

      return updated;
    });

    // Save updated coins
    await kv.set(COINS_KEY, updatedCoins);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      details: {
        totalCoins: coins.length,
        renamedToIndianKingdoms: renamedCount,
        movedToIndianKingdoms: movedCount
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
