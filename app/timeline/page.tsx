import { kv } from '@vercel/kv';
import Link from 'next/link';

interface TimelineEntry {
  id: string;
  name: string;
  time: string;
  timeStart: number;
  timeEnd: number | null;
  place: string;
  description: string;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  dynasty: string[];
  people?: string[];
  sideA?: string;
  sideB?: string;
  victor?: string;
  partOf?: string;
  region?: 'south-india' | 'north-india' | 'us';
  sortOrder?: number;
}

// Revalidate every hour so ChatGPT sees fresh data
export const revalidate = 3600;

async function getTimelineData() {
  try {
    const entries = await kv.get<TimelineEntry[]>('timeline_entries');
    return entries || [];
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }
}

function getBookPart(year: number): { title: string; period: string } {
  if (year < 1700) return { title: 'Before Part 1', period: 'Before 1700' };
  if (year >= 1700 && year < 1740) return { title: 'Part 1: Masters of Carnatic', period: '1700-1740' };
  if (year >= 1740 && year < 1754) return { title: 'Part 2: Pawns of Carnatic', period: '1740-1754' };
  if (year >= 1754 && year < 1787) return { title: 'Part 3: Paupers of Carnatic', period: '1754-1787' };
  if (year >= 1787 && year < 1807) return { title: 'Part 4: Phantoms of Carnatic', period: '1787-1807' };
  return { title: 'After Part 4', period: 'After 1807' };
}

export default async function TimelinePage() {
  const allEntries = await getTimelineData();

  // Sort entries by timeStart, then sortOrder (matches UI exactly)
  const sortedEntries = [...allEntries].sort((a, b) => {
    if (a.timeStart !== b.timeStart) return a.timeStart - b.timeStart;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  // Build parent-child map (matches UI hierarchy)
  const childrenMap = new Map<string, TimelineEntry[]>();
  sortedEntries.forEach(entry => {
    if (entry.partOf) {
      const children = childrenMap.get(entry.partOf) || [];
      children.push(entry);
      childrenMap.set(entry.partOf, children);
    }
  });

  // Get top-level entries (no parent)
  const topLevelEntries = sortedEntries.filter(e => !e.partOf);

  // Group by book parts (matches UI grouping)
  const groupedByPart = new Map<string, TimelineEntry[]>();
  topLevelEntries.forEach(entry => {
    const part = getBookPart(entry.timeStart);
    const key = part.title;
    const existing = groupedByPart.get(key) || [];
    existing.push(entry);
    groupedByPart.set(key, existing);
  });

  const partOrder = [
    'Before Part 1',
    'Part 1: Masters of Carnatic',
    'Part 2: Pawns of Carnatic',
    'Part 3: Paupers of Carnatic',
    'Part 4: Phantoms of Carnatic',
    'After Part 4'
  ];

  // Recursive render function to handle parent → child → grandchild
  function renderEntry(entry: TimelineEntry, level: number = 0): JSX.Element {
    const children = childrenMap.get(entry.id) || [];
    const indent = level * 2;

    return (
      <div key={entry.id} style={{ marginLeft: `${indent}rem` }} className="mb-4">
        <article className="border-l-4 border-blue-500 pl-4 py-2 bg-white">
          <header>
            <h3 className="text-lg font-semibold text-gray-900">
              {entry.name}
              {entry.verified && <span className="ml-2 text-sm text-green-600">✓ Verified</span>}
              {children.length > 0 && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {children.length} sub-event{children.length > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              <time dateTime={entry.timeStart.toString()}>{entry.time}</time>
              {entry.place && <span className="ml-2">• {entry.place}</span>}
              {entry.region && <span className="ml-2">• Region: {entry.region}</span>}
            </div>
          </header>

          <p className="mt-2 text-gray-700 leading-relaxed">{entry.description}</p>

          {entry.dynasty && entry.dynasty.length > 0 && (
            <div className="mt-2">
              <strong className="text-sm text-gray-600">Dynasties: </strong>
              <span className="text-sm text-gray-700">{entry.dynasty.join(', ')}</span>
            </div>
          )}

          {entry.people && entry.people.length > 0 && (
            <div className="mt-1">
              <strong className="text-sm text-gray-600">People: </strong>
              <span className="text-sm text-gray-700">{entry.people.join(', ')}</span>
            </div>
          )}

          {(entry.sideA || entry.sideB) && (
            <div className="mt-1">
              <strong className="text-sm text-gray-600">Battle: </strong>
              <span className="text-sm text-gray-700">
                {entry.sideA} vs {entry.sideB}
                {entry.victor && ` • Victor: ${entry.victor}`}
              </span>
            </div>
          )}

          {entry.source && (
            <footer className="mt-2 text-xs text-gray-500 italic">
              <strong>Source: </strong>
              {entry.sourceUrl ? (
                <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {entry.source}
                </a>
              ) : (
                entry.source
              )}
            </footer>
          )}
        </article>

        {children.length > 0 && (
          <div className="mt-2 space-y-2">
            {children.map(child => renderEntry(child, level + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-6 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historical Timeline - Ram & Dhruvan Coin Collection
          </h1>
          <p className="text-gray-600">
            Chronological timeline of events related to British India, Princely States, and European trading companies.
            Organized by book parts covering the Carnatic region from 1700-1807.
          </p>
          <nav className="mt-4 flex gap-4">
            <Link href="/?tab=timeline" className="text-blue-600 hover:underline text-sm">
              → Interactive Timeline (with filters)
            </Link>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              → Main App
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">Timeline Structure</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Total events:</strong> {allEntries.length}</li>
            <li>• <strong>Top-level events:</strong> {topLevelEntries.length}</li>
            <li>• <strong>Sub-events:</strong> {allEntries.length - topLevelEntries.length}</li>
            <li>• <strong>Time range:</strong> {Math.min(...allEntries.map(e => e.timeStart))} - {Math.max(...allEntries.map(e => e.timeStart))}</li>
            <li>• <strong>Organization:</strong> Grouped by book parts (Masters/Pawns/Paupers/Phantoms of Carnatic)</li>
            <li>• <strong>Hierarchy:</strong> Supports parent → child → grandchild relationships</li>
            <li>• <strong>Sorting:</strong> By year (timeStart) then custom sortOrder within same year</li>
          </ul>
        </section>

        {partOrder.map(partTitle => {
          const entries = groupedByPart.get(partTitle);
          if (!entries || entries.length === 0) return null;

          const part = getBookPart(entries[0].timeStart);

          return (
            <section key={partTitle} className="mb-12">
              <header className="mb-6 pb-3 border-b-2 border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900">{part.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{part.period}</p>
                <p className="text-xs text-gray-500 mt-1">{entries.length} top-level events</p>
              </header>

              <div className="space-y-6">
                {entries.map(entry => renderEntry(entry))}
              </div>
            </section>
          );
        })}

        {topLevelEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No timeline entries found.
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-4 mt-12">
        <div className="max-w-5xl mx-auto text-sm text-gray-600">
          <p className="mb-2"><strong>For AI/ChatGPT:</strong> This page shows the complete timeline structure with all events organized chronologically and hierarchically. Each event includes dynasties, people, battles, sources, and verification status.</p>
          <p>Interactive version with filtering: <a href="https://coin-tracker-snowy.vercel.app/?tab=timeline" className="text-blue-600 hover:underline">coin-tracker-snowy.vercel.app/?tab=timeline</a></p>
          <p className="mt-2">JSON API: <a href="/api/timeline" className="text-blue-600 hover:underline">/api/timeline</a></p>
        </div>
      </footer>
    </div>
  );
}
