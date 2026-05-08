import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TIMELINE_KEY = 'timeline_entries';

interface TimelineEntry {
  id: string;
  name: string;
  time: string;
  timeStart: number;
  timeEnd: number | null;
  place: string;
  description: string;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  dynasty: string;
  people?: string[];
  sideA?: string;
  sideB?: string;
  victor?: string;
  partOf?: string;
}

async function readEntries(): Promise<TimelineEntry[]> {
  try {
    const entries = await kv.get<TimelineEntry[]>(TIMELINE_KEY);
    return entries || [];
  } catch (error) {
    console.error('Error reading timeline from KV:', error);
    return [];
  }
}

async function writeEntries(entries: TimelineEntry[]): Promise<void> {
  await kv.set(TIMELINE_KEY, entries);
}

// GET - Retrieve all timeline entries
export async function GET() {
  try {
    const entries = await readEntries();
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read timeline entries' },
      { status: 500 }
    );
  }
}

// POST - Add a new timeline entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = await readEntries();

    const newEntry: TimelineEntry = {
      id: Date.now().toString(),
      name: body.name?.trim() || '',
      time: body.time?.trim() || '',
      timeStart: Number(body.timeStart) || 0,
      timeEnd: body.timeEnd ? Number(body.timeEnd) : null,
      place: body.place?.trim() || '',
      description: body.description?.trim() || '',
      source: body.source?.trim() || '',
      ...(body.sourceUrl?.trim() && { sourceUrl: body.sourceUrl.trim() }),
      verified: body.verified || false,
      dynasty: body.dynasty?.trim() || '',
      ...(body.people?.length && { people: body.people }),
      ...(body.sideA?.trim() && { sideA: body.sideA.trim() }),
      ...(body.sideB?.trim() && { sideB: body.sideB.trim() }),
      ...(body.victor?.trim() && { victor: body.victor.trim() }),
      ...(body.partOf?.trim() && { partOf: body.partOf.trim() }),
    };

    entries.push(newEntry);
    await writeEntries(entries);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add timeline entry' },
      { status: 500 }
    );
  }
}

// PUT - Update a timeline entry
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const entries = await readEntries();

    const entryIndex = entries.findIndex((e) => e.id === id);
    if (entryIndex === -1) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const trimmedBody: Partial<TimelineEntry> = {};
    for (const key in body) {
      const val = body[key];
      if (typeof val === 'string') {
        trimmedBody[key as keyof TimelineEntry] = val.trim() as any;
      } else {
        trimmedBody[key as keyof TimelineEntry] = val;
      }
    }

    entries[entryIndex] = {
      ...entries[entryIndex],
      ...trimmedBody,
    };

    await writeEntries(entries);

    return NextResponse.json(entries[entryIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update timeline entry' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a timeline entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const entries = await readEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await writeEntries(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete timeline entry' },
      { status: 500 }
    );
  }
}
