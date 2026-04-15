import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function GET() {
  try {
    const coins = await kv.get<any[]>(COINS_KEY);
    if (!coins) {
      return NextResponse.json({ message: 'No coins found' });
    }

    const sections = Array.from(new Set(coins.map(c => c.section))).filter(Boolean);
    const subsections = Array.from(new Set(coins.map(c => c.subsection))).filter(Boolean);

    let updatedCount = 0;
    const updatedCoins = coins.map((coin) => {
      const section = coin.section?.trim();
      const subsection = coin.subsection?.trim();
      
      // Check if we need to move based on section OR subsection
      if (section === 'European Overseas' || section === 'Delhi Sultanate' || 
          subsection === 'European Overseas' || subsection === 'Delhi Sultanate') {
        updatedCount++;
        return { ...coin, section: 'Other' };
      }
      return coin;
    });

    if (updatedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      message: 'Migration completed',
      updatedCount,
      totalCount: coins.length,
      availableSections: sections,
      availableSubsections: subsections
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
