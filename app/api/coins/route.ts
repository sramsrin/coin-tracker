import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COINS_KEY = 'coins';

interface Coin {
  id: string;
  index: string;
  section: string;
  subsection: string;
  subsubsection: string;
  issuer: string;
  faceValue: string;
  currency: string;
  kmNumber: string;
  numistaNumber: string;
  numistaLink: string;
  weight: string;
  book: string;
  numberAndNotes: string;
  obverse: string;
  reverse: string;
}

// Helper function to read coins from KV
async function readCoins(): Promise<Coin[]> {
  try {
    const coins = await kv.get<Coin[]>(COINS_KEY);
    return coins || [];
  } catch (error) {
    console.error('Error reading from KV:', error);
    return [];
  }
}

// Helper function to write coins to KV
async function writeCoins(coins: Coin[]): Promise<void> {
  await kv.set(COINS_KEY, coins);
}

// GET - Retrieve all coins
export async function GET() {
  try {
    const coins = await readCoins();
    return NextResponse.json(coins);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read coins' },
      { status: 500 }
    );
  }
}

// POST - Add a new coin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coins = await readCoins();

    const newCoin: Coin = {
      id: Date.now().toString(),
      index: body.index,
      section: body.section || '',
      subsection: body.subsection || '',
      subsubsection: body.subsubsection || '',
      issuer: body.issuer,
      faceValue: body.faceValue,
      currency: body.currency,
      kmNumber: body.kmNumber,
      numistaNumber: body.numistaNumber,
      numistaLink: body.numistaLink,
      weight: body.weight,
      book: body.book,
      numberAndNotes: body.numberAndNotes,
      obverse: body.obverse,
      reverse: body.reverse,
    };

    coins.push(newCoin);
    await writeCoins(coins);

    return NextResponse.json(newCoin, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add coin' },
      { status: 500 }
    );
  }
}

// PUT - Update a coin
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Coin ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const coins = await readCoins();

    const coinIndex = coins.findIndex((coin) => coin.id === id);
    if (coinIndex === -1) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }

    // Update the coin
    coins[coinIndex] = {
      ...coins[coinIndex],
      ...body,
    };

    await writeCoins(coins);

    return NextResponse.json(coins[coinIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update coin' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a coin
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Coin ID is required' },
        { status: 400 }
      );
    }

    const coins = await readCoins();
    const filteredCoins = coins.filter((coin) => coin.id !== id);
    await writeCoins(filteredCoins);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete coin' },
      { status: 500 }
    );
  }
}
