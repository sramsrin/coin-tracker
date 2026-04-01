import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST() {
  try {
    // Keys format: note:section:SectionName:subsection:SubName:subsubsection:SubSubName
    const keys = await kv.keys('note:section:*:subsection:*:subsubsection:*');
    console.log(`Found ${keys.length} sub-subsection note keys to delete`);

    let deletedCount = 0;
    for (const key of keys) {
      await kv.del(key);
      deletedCount++;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} sub-subsection descriptions from the database.`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sub-subsection notes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
