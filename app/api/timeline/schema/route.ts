import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface TimelineEntry {
  id: string;
  name: string;
  dynasty: string[];
  [key: string]: any;
}

export async function GET() {
  // Fetch existing timeline entries to extract dynasty names
  let existingDynasties: string[] = [];
  try {
    const entries = await kv.get<TimelineEntry[]>('timeline_entries');
    if (entries && entries.length > 0) {
      const dynastySet = new Set<string>();
      entries.forEach(entry => {
        if (Array.isArray(entry.dynasty)) {
          entry.dynasty.forEach(d => dynastySet.add(d));
        } else if (typeof entry.dynasty === 'string' && entry.dynasty) {
          dynastySet.add(entry.dynasty);
        }
      });
      existingDynasties = Array.from(dynastySet).sort();
    }
  } catch (error) {
    console.error('Failed to fetch existing dynasties:', error);
  }

  const schema = {
    title: 'Timeline & Theme Schema',
    instructions: {
      forAI: [
        'Generate valid JSON matching schemas below',
        'Keep descriptions concise and factual (1-3 sentences)',
        'NO flowery language: avoid "pivotal", "legendary", "transforms"',
        'Use EXACT dynasty names from existingDynastyNames list',
        'Include all required fields, omit optional if not applicable',
      ],
    },

    existingDynastyNames: {
      instruction: 'Use these exact names for dynasty field. Match spelling/capitalization.',
      names: existingDynasties,
      count: existingDynasties.length,
    },

    schemas: {
      timelineEvent: {
        required: ['name', 'time', 'timeStart', 'description'],
        fields: {
          name: { type: 'string', desc: 'Event title', ex: 'Battle of Plassey' },
          time: { type: 'string', desc: 'Human-readable time', ex: '1757 or 1740-1748' },
          timeStart: { type: 'number', desc: 'Start year (integer)', ex: 1757 },
          timeEnd: { type: 'number|null', desc: 'End year or null', ex: null },
          description: {
            type: 'string',
            desc: 'What happened (1-3 sentences, factual)',
            good: 'Marathas capture Gingee. Becomes key stronghold for 17 years.',
            bad: 'In a pivotal moment, legendary forces heroically capture...',
          },
          place: { type: 'string', desc: 'Location', ex: 'Plassey, Bengal', opt: true },
          source: { type: 'string', desc: 'Citation', ex: 'Book by Author, p.123', opt: true },
          sourceUrl: { type: 'string', desc: 'URL', opt: true },
          dynasty: {
            type: 'string|array',
            desc: 'Use EXACT names from existingDynastyNames',
            ex: ['EIC', 'Marathas'],
            opt: true,
          },
          people: { type: 'array', desc: 'Key figures', ex: ['Robert Clive'], opt: true },
          verified: { type: 'boolean', default: false, opt: true },
          region: { type: 'string', values: ['south-india', 'north-india', 'us'], opt: true },
          sideA: { type: 'string', desc: 'Battle: first party', opt: true },
          sideB: { type: 'string', desc: 'Battle: opposing party', opt: true },
          victor: { type: 'string', desc: 'Battle: winner (must match sideA/B)', opt: true },
          partOf: { type: 'string', desc: 'Parent event ID for sub-events', opt: true },
        },
      },

      theme: {
        required: ['bookPart', 'text'],
        fields: {
          bookPart: {
            type: 'string',
            values: {
              'before-part-1': 'Before 1700',
              'part-1': '1700-1740: Masters of Carnatic',
              'part-2': '1740-1754: Pawns of Carnatic',
              'part-3': '1754-1787: Paupers of Carnatic',
              'part-4': '1787-1807: Phantoms of Carnatic',
              'after-part-4': 'After 1807',
            },
          },
          title: { type: 'string', desc: 'Theme title', opt: true },
          text: { type: 'string', desc: 'Theme content (factual tone)' },
          source: { type: 'string', desc: 'Citation', opt: true },
          sourceUrl: { type: 'string', desc: 'URL', opt: true },
        },
      },
    },

    examples: {
      event: {
        name: 'Battle of Plassey',
        time: 'June 23, 1757',
        timeStart: 1757,
        place: 'Plassey, Bengal',
        description: 'EIC forces under Clive defeat Siraj-ud-Daulah. Gives Britain control of Bengal.',
        source: 'Plassey: The Battle',
        dynasty: ['EIC', 'Carnatic Nawab'],
        people: ['Robert Clive', 'Siraj-ud-Daulah'],
        sideA: 'EIC',
        sideB: 'Carnatic Nawab',
        victor: 'EIC',
        region: 'north-india',
      },
      theme: {
        bookPart: 'part-1',
        title: 'British Consolidation',
        text: 'EIC consolidated power through strategic alliances with local rulers.',
        source: 'Chapter 3',
      },
    },

    usage: {
      urls: {
        addEvent: 'https://coin-tracker-snowy.vercel.app/add-event',
        addTheme: 'https://coin-tracker-snowy.vercel.app/add-theme',
      },
      steps: ['Generate JSON', 'Copy output', 'Paste into add-event/add-theme page', 'Submit'],
    },
  };

  return NextResponse.json(schema, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
