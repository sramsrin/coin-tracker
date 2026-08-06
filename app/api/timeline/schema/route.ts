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
    title: 'Lavender Coin Timeline & Theme Schema',
    version: '1.0.0',
    instructions: {
      forAI: [
        'When asked to create timeline events or themes, generate valid JSON matching the schemas below',
        'Follow the style guide strictly - keep descriptions concise and factual',
        'Always include required fields, omit optional fields if not applicable',
        'Use the exact field names shown in the schemas',
        'IMPORTANT: For dynasty names, use the EXACT names from the existingDynastyNames list below',
        'Return only valid JSON, no additional commentary',
      ],
    },

    existingDynastyNames: {
      description: 'Use these EXACT dynasty names for consistency. Do not invent new names.',
      instruction: 'Always check this list first. If the dynasty you need is here, use the exact spelling and capitalization.',
      names: existingDynasties,
      count: existingDynasties.length,
    },

    schemas: {
      timelineEvent: {
        description: 'Historical timeline event for British India, Princely States, and related history',
        type: 'object',

        requiredFields: ['name', 'time', 'timeStart', 'description'],

        fields: {
          name: {
            type: 'string',
            required: true,
            description: 'Short, clear title of the event',
            examples: [
              'Battle of Plassey',
              'Anglo-French Neutrality Convention',
              'Siege of Arcot',
            ],
          },

          time: {
            type: 'string',
            required: true,
            description: 'Human-readable time period. Can be a single year, date, or range',
            format: 'Use formats like: "1757", "1740-1748", "June 23, 1757", "Early 1750s"',
            examples: ['1728', '1740-1748', 'June 23, 1757', 'Early 1750s'],
          },

          timeStart: {
            type: 'number',
            required: true,
            description: 'Start year as integer (for sorting/filtering)',
            examples: [1728, 1757, 1740],
          },

          timeEnd: {
            type: 'number | null',
            required: false,
            description: 'End year as integer. Use null for single-year events',
            examples: [null, 1748, 1763],
          },

          description: {
            type: 'string',
            required: true,
            description: 'Concise, factual description of what happened and its significance',
            styleRules: [
              'Keep to 1-3 sentences',
              'State what happened, who did it, what the consequence was',
              'NO flowery language - avoid: "pivotal", "legendary", "transforms", "marks", "foreshadows"',
              'Be direct and factual',
            ],
            goodExample: 'Marathas capture Gingee from Bijapur. Becomes a key Maratha stronghold for the next 17 years.',
            badExample: 'In a pivotal moment that would transform the political landscape, the legendary Maratha forces heroically capture the fortress...',
            examples: [
              'British forces under Robert Clive defeat Nawab Siraj-ud-Daulah. Victory gives British control of Bengal.',
              'Britain and France agree to neutrality in India despite European conflicts.',
              'Hyder Ali captures Bangalore from the Marathas. Establishes it as Mysore capital.',
            ],
          },

          place: {
            type: 'string',
            required: false,
            description: 'Location where event occurred',
            format: 'City, Region format preferred',
            examples: ['Plassey, Bengal', 'Paris, France', 'Arcot, Carnatic', 'Mysore'],
            default: '',
          },

          source: {
            type: 'string',
            required: false,
            description: 'Citation or reference for the information',
            format: 'Book title, Author, Page numbers. Or URL if online source.',
            examples: [
              'Cambridge History of India, Vol. 5',
              'Plassey: The Battle That Changed India by Sudeep Chakravarti',
              'History of Mysore by Lewis Rice, p. 123',
            ],
            default: '',
          },

          sourceUrl: {
            type: 'string',
            required: false,
            description: 'URL link to the source if available',
            examples: ['https://example.com/article'],
          },

          dynasty: {
            type: 'string | array of strings',
            required: false,
            description: 'Dynasty, kingdom, or political entity involved. Can be single string or array',
            IMPORTANT: `Use EXACT names from existingDynastyNames list above. Current count: ${existingDynasties.length} dynasties.`,
            instruction: 'Check existingDynastyNames first. Match spelling and capitalization exactly.',
            examples: existingDynasties.length > 0
              ? existingDynasties.slice(0, 10)
              : [
                  'British East India Company',
                  'French East India Company',
                  'Marathas',
                  'Mughal Empire',
                  'Nawab of Carnatic',
                ],
            default: [],
          },

          people: {
            type: 'array of strings',
            required: false,
            description: 'Key historical figures involved in the event',
            examples: [
              ['Robert Clive', 'Siraj-ud-Daulah', 'Mir Jafar'],
              ['Hyder Ali', 'Tipu Sultan'],
            ],
          },

          verified: {
            type: 'boolean',
            required: false,
            description: 'Whether information has been verified against sources',
            default: false,
          },

          region: {
            type: 'string',
            required: false,
            description: 'Geographic region for filtering',
            allowedValues: ['south-india', 'north-india', 'us'],
            default: 'south-india',
          },

          // Battle-specific fields (optional)
          sideA: {
            type: 'string',
            required: false,
            description: 'For battles: first party in the conflict',
            instruction: 'Should match a dynasty name from existingDynastyNames',
            examples: ['British East India Company', 'Marathas'],
          },

          sideB: {
            type: 'string',
            required: false,
            description: 'For battles: opposing party in the conflict',
            instruction: 'Should match a dynasty name from existingDynastyNames',
            examples: ['Bengal Nawabs', 'Mysore'],
          },

          victor: {
            type: 'string',
            required: false,
            description: 'For battles: the winning side (should match sideA or sideB exactly)',
            instruction: 'Must be identical to either sideA or sideB value',
            examples: ['British East India Company'],
          },

          // Nested event support
          partOf: {
            type: 'string',
            required: false,
            description: 'ID of parent event if this is a sub-event (for creating hierarchies)',
            format: 'Use the ID from an existing event',
            examples: ['1735689000000'],
          },
        },
      },

      theme: {
        description: 'Book part theme or narrative observation',
        type: 'object',

        requiredFields: ['bookPart', 'text'],

        fields: {
          bookPart: {
            type: 'string',
            required: true,
            description: 'Which part of the book this theme belongs to',
            allowedValues: ['before-part-1', 'part-1', 'part-2', 'part-3', 'part-4', 'after-part-4'],
            valueMap: {
              'before-part-1': 'Before Part 1 (Before 1690)',
              'part-1': 'Part 1: Masters of Tamil Nadu (1690-1740)',
              'part-2': 'Part 2: Pawns in Battle Between Powerful External Forces (1740-1754)',
              'part-3': 'Part 3: Paupers Drowning in Debt (1754-1787)',
              'part-4': 'Part 4: Phantom Rulers Before British Took Over Carnatic (1787-1807)',
              'after-part-4': 'After Part 4 (After 1807)',
            },
          },

          title: {
            type: 'string',
            required: false,
            description: 'Optional title for the theme',
            examples: ['Rise of British Power', 'Decline of Mughal Authority'],
          },

          text: {
            type: 'string',
            required: true,
            description: 'The theme content or narrative observation',
            styleRules: [
              'Can be longer than event descriptions',
              'Still maintain factual tone',
              'Connect multiple events or trends',
            ],
            examples: [
              'During this period, the British East India Company consolidated power through strategic alliances with local rulers.',
              'The Carnatic Wars marked a shift from trade to territorial control for European powers.',
            ],
          },

          source: {
            type: 'string',
            required: false,
            description: 'Citation or reference',
            examples: ['Chapter 3, page 45', 'Author Name, Book Title'],
          },

          sourceUrl: {
            type: 'string',
            required: false,
            description: 'URL link to source if available',
          },
        },
      },
    },

    examples: {
      simpleEvent: {
        name: 'Anglo-French Neutrality Convention',
        time: '1728',
        timeStart: 1728,
        timeEnd: null,
        place: 'Paris, France',
        description: 'Britain and France agree to neutrality in India despite European conflicts.',
        source: 'Cambridge History of India, Vol. 5',
        dynasty: existingDynasties.includes('British East India Company')
          ? ['British East India Company', 'French East India Company']
          : ['British East India Company', 'French East India Company'],
        region: 'south-india',
      },

      battleEvent: {
        name: 'Battle of Plassey',
        time: 'June 23, 1757',
        timeStart: 1757,
        place: 'Plassey, Bengal',
        description: 'British East India Company forces under Robert Clive defeat Nawab Siraj-ud-Daulah. Victory gives British control of Bengal.',
        source: 'Plassey: The Battle That Changed India',
        verified: true,
        dynasty: ['Bengal Nawabs', 'British East India Company'],
        people: ['Robert Clive', 'Siraj-ud-Daulah', 'Mir Jafar'],
        sideA: 'British East India Company',
        sideB: 'Bengal Nawabs',
        victor: 'British East India Company',
        region: 'north-india',
      },

      spanningEvent: {
        name: 'First Carnatic War',
        time: '1740-1748',
        timeStart: 1740,
        timeEnd: 1748,
        place: 'Carnatic',
        description: 'British and French vie for influence in South India as part of broader European conflicts. Ends with Treaty of Aix-la-Chapelle.',
        source: 'Wars in India by Author Name',
        dynasty: ['British East India Company', 'French East India Company', 'Nawab of Carnatic'],
        region: 'south-india',
      },

      simpleTheme: {
        bookPart: 'part-1',
        title: 'Consolidation of Control',
        text: 'During this period, the British East India Company consolidated power through strategic alliances with local rulers.',
        source: 'Chapter 3',
      },
    },

    usage: {
      addEventURL: 'https://coin-tracker-snowy.vercel.app/add-event',
      addThemeURL: 'https://coin-tracker-snowy.vercel.app/add-theme',
      instructions: [
        'Read this entire schema carefully, especially the existingDynastyNames list',
        'Generate JSON matching the schema above',
        'Use exact dynasty names from the list - do not create new variations',
        'Copy the JSON output',
        'Paste into the add-event or add-theme page',
        'Submit to add to the timeline',
      ],
    },
  };

  return NextResponse.json(schema, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
