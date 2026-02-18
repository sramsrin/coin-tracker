import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const MAP_POINTS_KEY = 'princely_states_map_colors';

interface ColorMapping {
  state: string;
  color: string; // RGB format: "r,g,b"
}

export async function POST() {
  try {
    // Get existing mappings
    const mappings = await kv.get<ColorMapping[]>(MAP_POINTS_KEY) || [];

    // Add Arcot color mapping
    const arcotMapping: ColorMapping = {
      state: 'Arcot',
      color: '0,190,180'
    };

    // Remove existing Arcot mapping if any
    const filtered = mappings.filter(m => m.state !== 'Arcot');
    filtered.push(arcotMapping);

    // Save updated mappings
    await kv.set(MAP_POINTS_KEY, filtered);

    return NextResponse.json({
      success: true,
      message: 'Successfully added Arcot color mapping to princely states map',
      mapping: arcotMapping
    });
  } catch (error) {
    console.error('Error adding Arcot mapping:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add Arcot mapping',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
