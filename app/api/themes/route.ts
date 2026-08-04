import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const THEMES_KEY = 'book_part_themes';

type BookPart = 'before-part-1' | 'part-1' | 'part-2' | 'part-3' | 'part-4' | 'after-part-4';

interface Theme {
  id: string;
  bookPart: BookPart;
  text: string;
  createdAt: number;
}

async function readThemes(): Promise<Theme[]> {
  try {
    const themes = await kv.get<Theme[]>(THEMES_KEY);
    return themes || [];
  } catch (error) {
    console.error('Error reading themes from KV:', error);
    return [];
  }
}

async function writeThemes(themes: Theme[]): Promise<void> {
  await kv.set(THEMES_KEY, themes);
}

// GET - Retrieve all themes
export async function GET() {
  try {
    const themes = await readThemes();
    return NextResponse.json(themes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read themes' },
      { status: 500 }
    );
  }
}

// POST - Add a new theme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const themes = await readThemes();

    const newTheme: Theme = {
      id: Date.now().toString(),
      bookPart: body.bookPart,
      text: body.text?.trim() || '',
      createdAt: Date.now(),
    };

    themes.push(newTheme);
    await writeThemes(themes);

    return NextResponse.json(newTheme, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add theme' },
      { status: 500 }
    );
  }
}

// PUT - Update a theme
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const themes = await readThemes();

    const themeIndex = themes.findIndex((t) => t.id === id);
    if (themeIndex === -1) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    themes[themeIndex] = {
      ...themes[themeIndex],
      text: body.text?.trim() || themes[themeIndex].text,
      bookPart: body.bookPart || themes[themeIndex].bookPart,
    };

    await writeThemes(themes);

    return NextResponse.json(themes[themeIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a theme
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    const themes = await readThemes();
    const filtered = themes.filter((t) => t.id !== id);
    await writeThemes(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    );
  }
}
