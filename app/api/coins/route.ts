import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { del } from '@vercel/blob';

const COINS_KEY = 'coins';

interface Coin {
  id: string;
  index: string;
  section: string;
  subsection: string;
  subsubsection: string;
  faceValue: string;
  currency: string;
  numistaNumber: string;
  numistaLink: string;
  weight: string;
  references: string;
  matchConfidence: 'High' | 'Medium' | 'Low' | 'None';
  image1Url?: string;
  image2Url?: string;
  referenceImageUrl?: string;
  secondarySection?: string;
  secondarySubsection?: string;
}

// Auto-compute secondary classification from existing coins in the same subsection
function inferSecondary(coin: Partial<Coin>, allCoins: Coin[]): { secondarySection?: string; secondarySubsection?: string } {
  // If secondary is already explicitly set, keep it
  if (coin.secondarySection) return {};

  const section = coin.section || '';
  const subsection = coin.subsection || '';
  const subsubsection = coin.subsubsection || '';

  // First try to match on (section, subsection, subsubsection) for more specific mapping
  const candidates = subsubsection
    ? allCoins.filter(c => c.section === section && c.subsection === subsection && c.subsubsection === subsubsection && c.secondarySection)
    : [];

  // Fall back to (section, subsection) if no subsubsection match
  const pool = candidates.length > 0
    ? candidates
    : allCoins.filter(c => c.section === section && c.subsection === subsection && c.secondarySection);

  if (pool.length === 0) return {};

  // Use the most common secondary among matching coins
  const secondarySection = pool[0].secondarySection!;
  const secondarySubsection = pool[0].secondarySubsection || '';

  return { secondarySection, secondarySubsection };
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
      index: body.index?.trim() || '',
      section: body.section?.trim() || '',
      subsection: body.subsection?.trim() || '',
      subsubsection: body.subsubsection?.trim() || '',
      faceValue: body.faceValue?.trim() || '',
      currency: body.currency?.trim() || '',
      numistaNumber: body.numistaNumber?.trim() || '',
      numistaLink: body.numistaLink?.trim() || '',
      weight: body.weight?.trim() || '',
      references: body.references?.trim() || '',
      matchConfidence: body.matchConfidence || 'High',
      image1Url: body.image1Url?.trim() || '',
      image2Url: body.image2Url?.trim() || '',
      referenceImageUrl: body.referenceImageUrl?.trim() || '',
      ...(body.secondarySection?.trim() && { secondarySection: body.secondarySection.trim() }),
      ...(body.secondarySubsection?.trim() && { secondarySubsection: body.secondarySubsection.trim() }),
    };

    // Auto-compute secondary from existing coins if not explicitly provided
    const inferred = inferSecondary(newCoin, coins);
    if (inferred.secondarySection) {
      newCoin.secondarySection = inferred.secondarySection;
      newCoin.secondarySubsection = inferred.secondarySubsection;
    }

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

    // Trim all string fields
    const trimmedBody: Partial<Coin> = {};
    for (const key in body) {
      if (typeof body[key] === 'string') {
        trimmedBody[key as keyof Coin] = body[key].trim() as any;
      } else {
        trimmedBody[key as keyof Coin] = body[key];
      }
    }

    // Update the coin
    coins[coinIndex] = {
      ...coins[coinIndex],
      ...trimmedBody,
    };

    // Auto-compute secondary if the section/subsection changed and no secondary was explicitly provided
    if ((trimmedBody.section || trimmedBody.subsection) && !trimmedBody.secondarySection) {
      const otherCoins = coins.filter((_, i) => i !== coinIndex);
      const inferred = inferSecondary(coins[coinIndex], otherCoins);
      if (inferred.secondarySection) {
        coins[coinIndex].secondarySection = inferred.secondarySection;
        coins[coinIndex].secondarySubsection = inferred.secondarySubsection;
      }
    }

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
    const coinToDelete = coins.find((coin) => coin.id === id);

    // Clean up blob images if they exist
    if (coinToDelete) {
      const urlsToDelete = [coinToDelete.image1Url, coinToDelete.image2Url, coinToDelete.referenceImageUrl].filter(Boolean) as string[];
      if (urlsToDelete.length > 0) {
        try {
          await del(urlsToDelete);
        } catch (blobError) {
          console.error('Error deleting blob images:', blobError);
        }
      }
    }

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
