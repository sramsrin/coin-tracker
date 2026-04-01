import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';
const MAP_POINTS_KEY = 'princely_states_map_colors';

interface ColorMapping {
  state: string;
  color: string;
}

export async function POST() {
  try {
    // 1. Update Coins
    const coins = await kv.get<any[]>(COINS_KEY);
    let updatedCoinsCount = 0;
    let updatedCoins: any[] = [];
    
    if (coins && Array.isArray(coins)) {
      updatedCoins = coins.map(coin => {
        let changed = false;
        if (coin.subsection === 'Kishangarh') {
          coin.subsection = 'Kishangarh/Jaipur';
          changed = true;
        }
        if (coin.subsubsection === 'Kishangarh') {
          coin.subsubsection = 'Kishangarh/Jaipur';
          changed = true;
        }
        if (changed) updatedCoinsCount++;
        return coin;
      });

      if (updatedCoinsCount > 0) {
        await kv.set(COINS_KEY, updatedCoins);
      }
    }

    // 2. Update Map Color Mappings
    const mappings = await kv.get<ColorMapping[]>(MAP_POINTS_KEY);
    let updatedMappingsCount = 0;
    
    if (mappings && Array.isArray(mappings)) {
      const updatedMappings = mappings.map(m => {
        if (m.state === 'Kishangarh') {
          updatedMappingsCount++;
          return { ...m, state: 'Kishangarh/Jaipur' };
        }
        return m;
      });

      if (updatedMappingsCount > 0) {
        await kv.set(MAP_POINTS_KEY, updatedMappings);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCoinsCount,
      updatedMappingsCount,
      message: `Successfully renamed Kishangarh to Kishangarh/Jaipur in ${updatedCoinsCount} coins and ${updatedMappingsCount} map color mappings.`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 });
  }
}
