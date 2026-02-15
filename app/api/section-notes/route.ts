import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Helper function to generate key based on selection
function generateKey(section: string | null, subsection: string | null, subsubsection: string | null): string {
  if (!section) {
    return 'note:intro';
  }

  let key = `note:section:${section}`;

  if (subsection) {
    key += `:subsection:${subsection}`;
  }

  if (subsubsection) {
    key += `:subsubsection:${subsubsection}`;
  }

  return key;
}

// GET - Retrieve the text note for a specific selection
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');
    const subsection = searchParams.get('subsection');
    const subsubsection = searchParams.get('subsubsection');

    const key = generateKey(section, subsection, subsubsection);
    const textValue = await kv.get<string>(key);

    return NextResponse.json({
      text: textValue || '',
      key
    });
  } catch (error) {
    console.error('Error reading section note:', error);
    return NextResponse.json(
      { error: 'Failed to read section note' },
      { status: 500 }
    );
  }
}

// POST - Save the text note for a specific selection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, subsection, subsubsection, text } = body;

    const key = generateKey(section || null, subsection || null, subsubsection || null);
    await kv.set(key, text || '');

    return NextResponse.json({
      text: text || '',
      key,
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving section note:', error);
    return NextResponse.json(
      { error: 'Failed to save section note' },
      { status: 500 }
    );
  }
}
