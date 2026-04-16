import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coins = body.coins;

    if (!Array.isArray(coins)) {
      return NextResponse.json({ error: 'coins must be an array' }, { status: 400 });
    }

    await kv.set(COINS_KEY, coins);

    return NextResponse.json({ success: true, count: coins.length });
  } catch (error) {
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
