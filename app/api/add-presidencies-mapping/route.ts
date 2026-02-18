import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const MAP_POINTS_KEY = 'presidencies_map_colors';

interface ColorMapping {
  state: string;
  color: string;
}

export async function POST() {
  try {
    // Presidency fill colors, border colors, and stripe colors (for hatched districts)
    const mappings: ColorMapping[] = [
      // Madras Presidency: light peach fill + border
      { state: 'Madras Presidency', color: '255,200,180' },
      { state: 'Madras Presidency', color: '200,120,100' },
      // Also include Arcot, Madurai, Sivagangai (annexed districts within Madras)
      // Arcot: teal fill + stripe + boundary
      { state: 'Madras Presidency', color: '0,190,180' },
      { state: 'Madras Presidency', color: '0,140,130' },
      { state: 'Madras Presidency', color: '0,100,95' },
      // Madurai: orange fill + stripe + boundary
      { state: 'Madras Presidency', color: '220,120,50' },
      { state: 'Madras Presidency', color: '170,85,30' },
      { state: 'Madras Presidency', color: '160,80,30' },
      // Sivagangai/Ramnad: blue fill + stripe + boundary
      { state: 'Madras Presidency', color: '50,140,220' },
      { state: 'Madras Presidency', color: '30,100,170' },
      { state: 'Madras Presidency', color: '30,90,160' },

      // Bombay Presidency: light blue fill + border
      { state: 'Bombay Presidency', color: '180,210,255' },
      { state: 'Bombay Presidency', color: '100,130,200' },

      // Bengal Presidency: light green fill + border
      { state: 'Bengal Presidency', color: '180,240,190' },
      { state: 'Bengal Presidency', color: '100,180,110' },
    ];

    await kv.set(MAP_POINTS_KEY, mappings);

    return NextResponse.json({
      success: true,
      message: `Added ${mappings.length} presidency color mappings`,
      mappings
    });
  } catch (error) {
    console.error('Error adding presidency mappings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add presidency mappings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
