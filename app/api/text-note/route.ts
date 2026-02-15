import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TEXT_NOTE_KEY = 'text_note_value';

// GET - Retrieve the text note
export async function GET() {
  try {
    const textValue = await kv.get<string>(TEXT_NOTE_KEY);
    return NextResponse.json({ text: textValue || '' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read text note' },
      { status: 500 }
    );
  }
}

// POST - Save the text note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const textValue = body.text || '';

    await kv.set(TEXT_NOTE_KEY, textValue);

    return NextResponse.json({ text: textValue }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save text note' },
      { status: 500 }
    );
  }
}
