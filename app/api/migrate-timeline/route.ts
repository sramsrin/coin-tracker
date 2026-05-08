import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TIMELINE_KEY = 'timeline_entries';

// PATCH: update specific entries by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body; // Array of { id, fields }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates must be an array of {id, fields}' }, { status: 400 });
    }

    const existing = (await kv.get<any[]>(TIMELINE_KEY)) || [];
    let changed = 0;

    for (const { id, fields } of updates) {
      const idx = existing.findIndex((e: any) => e.id === id || e.id === String(id));
      if (idx !== -1) {
        existing[idx] = { ...existing[idx], ...fields };
        changed++;
      }
    }

    await kv.set(TIMELINE_KEY, existing);

    return NextResponse.json({ message: `Updated ${changed} of ${updates.length} entries`, total: existing.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to migrate' }, { status: 500 });
  }
}
