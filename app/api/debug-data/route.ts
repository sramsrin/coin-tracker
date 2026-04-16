import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

export async function GET() {
  try {
    const coins = await kv.get<any[]>(COINS_KEY);
    if (!coins) return NextResponse.json({ message: 'No coins found' });

    const breakdown = coins.reduce((acc, coin) => {
      const section = coin.section || 'Unknown';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      total: coins.length,
      breakdown
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
