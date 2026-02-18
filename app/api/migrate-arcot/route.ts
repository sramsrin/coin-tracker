import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST() {
  try {
    // Get all coins from the database
    const coins = await kv.get('coins') as any[] || [];

    let updatedCount = 0;

    // Update all Arcot coins
    const updatedCoins = coins.map(coin => {
      if (coin.section === 'Older Indian Kingdoms' && coin.subsection === 'Arcot') {
        updatedCount++;
        return {
          ...coin,
          section: 'British India Princely States',
          subsection: 'Madras States Agency',
          subsubsection: 'Arcot'
        };
      }
      return coin;
    });

    // Save updated coins back to database
    await kv.set('coins', updatedCoins);

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updatedCount} Arcot coins from Older Indian Kingdoms to British India Princely States > Madras States Agency`,
      updatedCount
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
