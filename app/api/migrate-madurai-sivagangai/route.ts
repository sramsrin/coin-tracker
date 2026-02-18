import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST() {
  try {
    const coins = await kv.get<any[]>(COINS_KEY) || [];
    let maduraiCount = 0;
    let sivagangaiCount = 0;

    const updated = coins.map(coin => {
      if ((coin.section === 'Older Indian Kingdoms' || coin.section === 'European Overseas') && coin.subsection === 'Madurai') {
        maduraiCount++;
        return {
          ...coin,
          section: 'British India Princely States',
          subsection: 'Madras States Agency',
          subsubsection: 'Madurai'
        };
      }
      if (coin.section === 'Older Indian Kingdoms' && coin.subsection === 'Sivagangai') {
        sivagangaiCount++;
        return {
          ...coin,
          section: 'British India Princely States',
          subsection: 'Madras States Agency',
          subsubsection: 'Sivagangai'
        };
      }
      return coin;
    });

    await kv.set(COINS_KEY, updated);

    return NextResponse.json({
      success: true,
      message: `Migrated ${maduraiCount} Madurai and ${sivagangaiCount} Sivagangai coins to Madras States Agency`,
      maduraiCount,
      sivagangaiCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
