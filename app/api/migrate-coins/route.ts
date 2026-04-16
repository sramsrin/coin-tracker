import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST(request: NextRequest) {
  try {
    const { coins } = await request.json();
    if (!Array.isArray(coins)) {
      return NextResponse.json({ error: 'coins must be an array' }, { status: 400 });
    }
    await kv.set(COINS_KEY, coins);
    return NextResponse.json({ message: 'Migration complete', count: coins.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
