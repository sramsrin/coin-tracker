import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.coins || !Array.isArray(body.coins)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    await kv.set(COINS_KEY, body.coins);
    return NextResponse.json({ success: true, count: body.coins.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to migrate' }, { status: 500 });
  }
}
