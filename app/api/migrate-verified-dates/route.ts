import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST() {
  try {
    // 1. Get all coins
    const coins = await kv.get<any[]>(COINS_KEY);
    if (!coins || !Array.isArray(coins)) {
      return NextResponse.json({ error: 'No coins found' }, { status: 404 });
    }

    // 2. Get all note keys
    const noteKeys = await kv.keys('note:section:*');
    console.log(`Found ${noteKeys.length} note keys`);

    const categoriesToUpdate: { section: string; subsection?: string; subsubsection?: string }[] = [];

    // 3. Find notes that say "verified on 03/26"
    for (const key of noteKeys) {
      const text = await kv.get<string>(key);
      if (text && text.toLowerCase().includes('verified on 03/26')) {
        console.log(`Matched note: ${key}`);
        // Extract section, subsection, subsubsection from key:
        // note:section:SectionName:subsection:SubName:subsubsection:SubSubName
        const parts = key.split(':');
        const category: any = {};
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'section') category.section = parts[i+1];
          if (parts[i] === 'subsection') category.subsection = parts[i+1];
          if (parts[i] === 'subsubsection') category.subsubsection = parts[i+1];
        }
        
        categoriesToUpdate.push(category);
      }
    }

    console.log(`Found ${categoriesToUpdate.length} categories to update`);

    // 4. Update coins: apply verified date to matched categories (except Travancore)
    // AND explicitly remove verified date from Travancore coins
    let updatedCount = 0;
    let removedCount = 0;
    
    const updatedCoins = coins.map(coin => {
      const isTravancore = 
        (coin.subsection && coin.subsection.toLowerCase().includes('travancore')) ||
        (coin.subsubsection && coin.subsubsection.toLowerCase().includes('travancore'));

      if (isTravancore) {
        if (coin.dateVerified) {
          removedCount++;
          const { dateVerified, ...rest } = coin;
          return rest;
        }
        return coin;
      }

      const match = categoriesToUpdate.some(cat => {
        const sectionMatch = coin.section === cat.section;
        const subsectionMatch = !cat.subsection || coin.subsection === cat.subsection;
        const subsubsectionMatch = !cat.subsubsection || coin.subsubsection === cat.subsubsection;
        return sectionMatch && subsectionMatch && subsubsectionMatch;
      });

      if (match) {
        updatedCount++;
        return {
          ...coin,
          dateVerified: 'March, 2026'
        };
      }
      return coin;
    });

    // 5. Save updated coins
    if (updatedCount > 0 || removedCount > 0) {
      await kv.set(COINS_KEY, updatedCoins);
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      removedCount,
      categoriesFound: categoriesToUpdate.length,
      message: `Successfully updated ${updatedCount} coins and removed verified date from ${removedCount} Travancore coins.`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate coins', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
