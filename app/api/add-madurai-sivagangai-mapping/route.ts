import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const MAP_POINTS_KEY = 'princely_states_map_colors';

interface ColorMapping {
  state: string;
  color: string; // RGB format: "r,g,b"
}

export async function POST() {
  try {
    const mappings = await kv.get<ColorMapping[]>(MAP_POINTS_KEY) || [];

    // Madurai: fill RGB(220,120,50), stripe RGB(170,85,30), boundary RGB(160,80,30)
    // Sivagangai (Ramnad district): fill RGB(50,140,220), stripe RGB(30,100,170), boundary RGB(30,90,160)
    // Arcot stripe: RGB(0,140,130), boundary RGB(0,100,95) (base already mapped)
    const newMappings: ColorMapping[] = [
      { state: 'Madurai', color: '220,120,50' },
      { state: 'Madurai', color: '170,85,30' },
      { state: 'Madurai', color: '160,80,30' },
      { state: 'Sivagangai', color: '50,140,220' },
      { state: 'Sivagangai', color: '30,100,170' },
      { state: 'Sivagangai', color: '30,90,160' },
      { state: 'Arcot', color: '0,140,130' },
      { state: 'Arcot', color: '0,100,95' },
    ];

    // Remove existing mappings for these states
    const filtered = mappings.filter(m => m.state !== 'Madurai' && m.state !== 'Sivagangai'
      && !(m.state === 'Arcot' && (m.color === '0,140,130' || m.color === '0,100,95')));
    filtered.push(...newMappings);

    await kv.set(MAP_POINTS_KEY, filtered);

    return NextResponse.json({
      success: true,
      message: 'Added Madurai and Sivagangai color mappings',
      mappings: newMappings
    });
  } catch (error) {
    console.error('Error adding mappings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add mappings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
