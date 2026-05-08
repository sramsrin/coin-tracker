import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TIMELINE_KEY = 'timeline_entries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
    }

    // Read existing entries
    const existing = (await kv.get<any[]>(TIMELINE_KEY)) || [];

    // Append new entries
    const combined = [...existing, ...entries];
    await kv.set(TIMELINE_KEY, combined);

    return NextResponse.json({
      message: `Added ${entries.length} entries. Total: ${combined.length}`,
      total: combined.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to migrate' }, { status: 500 });
  }
}
