import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TIMELINE_KEY = 'timeline_entries';

// POST - Bulk seed timeline entries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = body.entries;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'entries must be an array' },
        { status: 400 }
      );
    }

    await kv.set(TIMELINE_KEY, entries);

    return NextResponse.json({
      success: true,
      count: entries.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to migrate timeline entries' },
      { status: 500 }
    );
  }
}
