import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 });
    }

    const html = await response.text();

    // Extract title - try Open Graph first, then regular title tag
    let title = '';

    // Try Open Graph title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    } else {
      // Try regular title tag
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1];
      }
    }

    // Extract description
    let description = '';
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    if (ogDescMatch) {
      description = ogDescMatch[1];
    } else {
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
      if (metaDescMatch) {
        description = metaDescMatch[1];
      }
    }

    // Clean up HTML entities
    title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    description = description.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    return NextResponse.json({
      title: title || 'Blog Post',
      description: description || '',
    });

  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}
