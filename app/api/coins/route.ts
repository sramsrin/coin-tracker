import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'coins-data.json');

interface Coin {
  id: string;
  index: string;
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

// Helper function to read coins from file
async function readCoins(): Promise<Coin[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write coins to file
async function writeCoins(coins: Coin[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(coins, null, 2), 'utf-8');
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
