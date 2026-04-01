import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST() {
  try {
    // Subsection keys format: note:section:SectionName:subsection:SubName
    // (This pattern matches keys with section and subsection, but NOT with subsubsection)
    const allSectionKeys = await kv.keys('note:section:*');
    console.log(`Checking ${allSectionKeys.length} total section-related keys`);

    const keysToDelete = allSectionKeys.filter(key => {
      const parts = key.split(':');
      // Sub-subsection key has 7 parts: note(0):section(1):S(2):subsection(3):Sub(4):subsubsection(5):SubSub(6)
      // Subsection key has 5 parts: note(0):section(1):S(2):subsection(3):Sub(4)
      return parts.length === 5 && parts[3] === 'subsection';
    });

    console.log(`Found ${keysToDelete.length} subsection note keys to delete`);

    let deletedCount = 0;
    for (const key of keysToDelete) {
      await kv.del(key);
      deletedCount++;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} subsection descriptions from the database.`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subsection notes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
