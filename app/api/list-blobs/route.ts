import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const allBlobs: { url: string; pathname: string; size: number; uploadedAt: Date }[] = [];
    let cursor: string | undefined;

    // Paginate through all blobs
    do {
      const result = await list({ cursor, prefix: 'coins/' });
      allBlobs.push(
        ...result.blobs.map((b) => ({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
        }))
      );
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);

    return NextResponse.json({
      total: allBlobs.length,
      blobs: allBlobs,
    });
  } catch (error) {
    console.error('Error listing blobs:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
