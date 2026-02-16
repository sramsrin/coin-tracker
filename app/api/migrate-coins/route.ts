import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coins = body.coins;

    if (!coins || !Array.isArray(coins)) {
      return NextResponse.json(
        { error: 'Invalid coins data' },
        { status: 400 }
      );
    }

    // Write all coins to KV
    await kv.set(COINS_KEY, coins);

    console.log(`✅ Migrated ${coins.length} coins to KV`);
    console.log(`Sample coin with date: ${coins[0].date}`);

    return NextResponse.json({
      success: true,
      count: coins.length,
      message: `Successfully migrated ${coins.length} coins to KV database`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate coins' },
      { status: 500 }
    );
  }
}
