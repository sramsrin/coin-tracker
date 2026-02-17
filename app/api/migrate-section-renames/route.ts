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

    let renamedSectionsCount = 0;
    let movedAnnexedKingdomsCount = 0;

    const updatedCoins = coins.map(coin => {
      let updated = { ...coin };

      // 1. Rename "Older Indian Kingdoms" to "British India Princely States"
      if (updated.section === 'Older Indian Kingdoms') {
        updated.section = 'British India Princely States';
        renamedSectionsCount++;
      }

      // 2. Rename "British India Post 1835" to "British India Uniform Coinage"
      if (updated.section === 'British India Post 1835') {
        updated.section = 'British India Uniform Coinage';
        renamedSectionsCount++;
      }

      // 3. Rename "British India Pre 1835" to "British India Presidencies"
      if (updated.section === 'British India Pre 1835') {
        updated.section = 'British India Presidencies';
        renamedSectionsCount++;
      }

      // 4. Move "Annexed kingdoms" subsection to its own "Older Indian Kingdoms" section
      if (updated.subsection === 'Annexed kingdoms') {
        movedAnnexedKingdomsCount++;
        return {
          ...updated,
          section: 'Older Indian Kingdoms',
          subsection: updated.subsubsection || '',
          subsubsection: ''
        };
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
        renamedSections: renamedSectionsCount,
        movedAnnexedKingdoms: movedAnnexedKingdomsCount
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
