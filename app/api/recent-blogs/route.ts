import { NextRequest, NextResponse } from 'next/server';

const BLOG_FEED_URL = 'https://ramindianhistoryessays.blogspot.com/feeds/posts/default?alt=json&max-results=10';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = Math.min(parseInt(searchParams.get('count') || '3', 10), 10);
    const excludeParam = searchParams.get('exclude') || '';
    const excludeUrls = excludeParam ? excludeParam.split(',').map(u => u.trim()) : [];

    const response = await fetch(BLOG_FEED_URL, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch blog feed' }, { status: 502 });
    }

    const data = await response.json();
    const entries = data.feed?.entry || [];

    const posts: { title: string; url: string; published: string }[] = [];
    for (const entry of entries) {
      const title = entry.title?.$t || 'Blog Post';
      const link = entry.link?.find((l: { rel: string; href: string }) => l.rel === 'alternate');
      const url = link?.href || '';
      const published = entry.published?.$t || '';

      if (url && !excludeUrls.some(ex => url.includes(ex))) {
        posts.push({ title, url, published });
      }

      if (posts.length >= count) break;
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog feed:', error);
    return NextResponse.json({ error: 'Failed to fetch blog feed' }, { status: 500 });
  }
}
