import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const MAP_POINTS_KEY = 'presidencies_map_colors';

interface ColorMapping {
  state: string;
  color: string; // RGB format: "r,g,b"
}

// GET - Retrieve all color mappings
export async function GET() {
  try {
    const mappings = await kv.get<ColorMapping[]>(MAP_POINTS_KEY);
    return NextResponse.json(mappings || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read presidencies map color mappings' },
      { status: 500 }
    );
  }
}

// POST - Add or update a color mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mappings = await kv.get<ColorMapping[]>(MAP_POINTS_KEY) || [];

    const newMapping: ColorMapping = {
      state: body.state?.trim() || '',
      color: body.color?.trim() || '',
    };

    // Remove existing mapping for this state+color combo if any
    const filtered = mappings.filter(m => !(m.state === newMapping.state && m.color === newMapping.color));
    filtered.push(newMapping);

    await kv.set(MAP_POINTS_KEY, filtered);

    return NextResponse.json(newMapping, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add presidencies color mapping' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a color mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    if (!state) {
      return NextResponse.json(
        { error: 'State name is required' },
        { status: 400 }
      );
    }

    const mappings = await kv.get<ColorMapping[]>(MAP_POINTS_KEY) || [];
    const filtered = mappings.filter(m => m.state !== state);
    await kv.set(MAP_POINTS_KEY, filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete presidencies color mapping' },
      { status: 500 }
    );
  }
}
