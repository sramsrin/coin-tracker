# Lavender Coin App - Complete Project Reference

## Overview
Next.js 14 single-page application for cataloging a coin collection focused on British India, Princely States, and European trading companies. Combines a coin inventory, interactive historical maps, and a dynasty/events timeline. Built for the "Ram & Dhruvan Coin Collection".

## Deployment & Infrastructure

| Component | Detail |
|---|---|
| **Production URL** | https://coin-tracker-snowy.vercel.app/ |
| **Platform** | Vercel |
| **Database** | Vercel KV (Upstash Redis) |
| **Image Storage** | Vercel Blob (`coins/` prefix) |
| **Framework** | Next.js 14, React 18, TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS 3 |
| **No tests** | No test framework configured |

## Critical Rules

1. **All coin data lives in Vercel KV** - there is NO local JSON data file. Never create one.
2. **There is no `/api/migrate-coins` endpoint.**
3. **The main page (`app/page.tsx`) is ~4000 lines.** It contains nearly all UI logic. Read specific line ranges rather than the whole file.
4. **Environment variables** are in `.env.local` (not committed). Required: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `BLOB_READ_WRITE_TOKEN`.

## Coin Data Protection Rules (MANDATORY)

**These rules MUST be followed for ANY coin data modification. No exceptions.**

1. **NO bulk updates.** Never call `kv.set('coins', ...)` to overwrite the entire coins array. Never write a script that modifies multiple coins at once. Every coin change must go through the single-coin REST API (`PUT /api/coins?id=<id>`).
2. **One coin at a time.** Each coin update, addition, or deletion must be a single, isolated operation. Do NOT batch, loop, or parallelize coin mutations.
3. **Explicit user approval required for every change.** Before making ANY coin data change (add, update, or delete), Claude MUST:
   - Clearly describe the specific change (which coin, which fields, old value → new value)
   - Wait for the user to explicitly approve (e.g., "yes", "approved", "go ahead")
   - Only then execute the single API call
4. **Never silently modify coin data.** Even if a change seems trivial or obviously correct, always ask first.
5. **Backup exists in `Backup/` folder.** A full JSON backup of all KV data (coins, timeline, map colors, notes) is stored there. Dated 2026-07-11.

## Reading/Writing Coin Data via CLI

```bash
# Read all coins from production KV
curl -s https://coin-tracker-snowy.vercel.app/api/coins -o /tmp/coins.json

# The coins API supports standard REST:
# GET  /api/coins              → all coins (JSON array)
# POST /api/coins              → add coin (body = coin fields)
# PUT  /api/coins?id=<coinId>  → update coin
# DELETE /api/coins?id=<coinId> → delete coin (also deletes blob images)
```

## Project Structure

```
app/
  page.tsx                          # Main SPA (~4000 lines) - all tabs, forms, maps
  layout.tsx                        # Root layout with metadata
  globals.css                       # Tailwind base + coin-highlight animation
  components/
    TimelineTab.tsx                  # Timeline/historical events UI
  api/
    coins/route.ts                  # CRUD for coins (KV key: 'coins')
    coins/upload/route.ts           # Image upload to Vercel Blob (max 10MB)
    map-points/route.ts             # Princely States map colors (KV: 'princely_states_map_colors')
    european-map-points/route.ts    # European trading map colors (KV: 'european_colonial_map_colors')
    presidencies-map-points/route.ts # Presidencies map colors (KV: 'presidencies_map_colors')
    timeline/route.ts               # Timeline events CRUD (KV: 'timeline_entries')
    section-notes/route.ts          # Per-section text notes (KV: 'note:section:X:subsection:Y:...')
    text-note/route.ts              # Global text note (KV: 'text_note_value')
    link-preview/route.ts           # Extracts OG/meta tags from URLs
    recent-blogs/route.ts           # Fetches Blogger feed (ramindianhistoryessays.blogspot.com)
    debug-data/route.ts             # Coin count stats
    list-blobs/route.ts             # Lists all uploaded images
data/
  dynasty-mapping.json              # Maps sections/subsections → dynasty names (for timeline linking)
public/maps/
  princely-states.png               # Base map image for canvas highlighting
  european-trading-posts-1600-1750.png
  presidencies-map.png
```

## Data Schema

### Coin
```typescript
interface Coin {
  id: string;                   // Date.now().toString()
  index: string;                // Book slot "page.slot" (e.g., "3.7") or "In Transit"
  section: string;              // Top-level category
  subsection: string;           // Sub-category (agency, presidency, etc.)
  subsubsection: string;        // Specific state/issuer (used for map highlighting)
  faceValue: string;
  currency: string;
  numistaNumber: string;
  numistaLink: string;          // URL to numista.com entry
  weight: string;
  references: string;           // Match notes; supports [display text|URL] link format
  matchConfidence: 'High' | 'Medium' | 'Low' | 'None';
  image1Url?: string;           // Obverse (Vercel Blob URL)
  image2Url?: string;           // Reverse (Vercel Blob URL)
  referenceImageUrl?: string;   // Catalog reference image
  secondarySection?: string;    // Auto-computed cross-classification
  secondarySubsection?: string;
}
```

### Section Hierarchy (current known sections)
- **British India Princely States** → subsections are agencies (Rajputana, Central India, etc.) → subsubsections are states (Bikaner, Jaipur, etc.)
- **British India Uniform Coinage** → post-1835 unified coinage
- **British India Presidencies** → Bengal, Madras, Bombay
- **European Trading Companies** → Portuguese, Dutch, Danish, French
- **Annexed Kingdoms** → kingdoms annexed by British
- **Indeterminate** → unidentified coins

### Vercel KV Keys
| Key | Type | Purpose |
|---|---|---|
| `coins` | `Coin[]` | All coin data |
| `timeline_entries` | `TimelineEntry[]` | Historical events |
| `princely_states_map_colors` | `ColorMapping[]` | Princely States map state→color |
| `european_colonial_map_colors` | `ColorMapping[]` | European map colors |
| `presidencies_map_colors` | `ColorMapping[]` | Presidencies map colors |
| `text_note_value` | `string` | Global text note |
| `note:section:X[:subsection:Y[:subsubsection:Z]]` | `string` | Hierarchical section notes |

## Key Application Features

### Tabs
- **Map (Explore)** - Three interactive canvas maps with pixel-level highlighting. Uses HTML5 Canvas to color-match regions and highlight/dim areas.
- **Collection** - Coin table with grouping by section→subsection→subsubsection, sorting, filtering, add/edit/delete forms.
- **Timeline** - Historical events with era grouping, dynasty/region filtering, battle support.

### URL State Sync
Tab, section, subsection, and coin ID are synced to URL query params (`?tab=map&section=...&coin=coinId`), enabling deep linking. Uses `window.history.replaceState()`.

### Authentication
Client-side password check (`SRMPv7006@`) stored in `localStorage.isAuthenticated`. Protects add/edit/delete operations. No server-side session.

### Auto-Computed Secondary Classification
When a coin is added/updated, `inferSecondary()` in `app/api/coins/route.ts` checks other coins in the same section+subsection to auto-fill `secondarySection`/`secondarySubsection` if not explicitly set.

### Map Highlight Algorithm
1. Load PNG into canvas, store original `ImageData`
2. On state selection, find pixels matching that state's RGB color
3. Turn matching pixels white, dim all others to 40% brightness
4. European map also enlarges colored dots for visibility

### Book Index System
Coins are tracked by physical book location: `page.slot` format (e.g., "3.7"). "In Transit" marks unshelved coins. Sorting puts shelved coins first.

## Common Modification Patterns

### Adding a new section
1. Add coins with the new section name via the UI or API
2. If it needs map support, create a new map image in `public/maps/` and add a new API route for its color mappings
3. Update `data/dynasty-mapping.json` if timeline linking is needed

### Adding a new API route
- Create `app/api/<name>/route.ts`
- Import `kv` from `@vercel/kv`
- Export async functions for HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
- Follow the existing pattern in any route file

### Modifying the main UI
- Nearly everything is in `app/page.tsx`
- Search for the tab/feature by its visible text or state variable name
- Key state variables: `activeTab`, `selectedSection`, `selectedSubsection`, `selectedState`, `mapMode`, `coins`, `editingCoin`, `showAddCoinForm`

### Coin data modifications
**All coin changes require explicit user approval, one coin at a time.** See "Coin Data Protection Rules" above. Bulk overwrites of the `coins` KV key are prohibited.

### Timeline and Database Entry Descriptions
**IMPORTANT:** When proposing changes to timeline or other database entries:
- **No fluff.** Keep descriptions crisp and to the point
- **Avoid flowery language.** No "marks a pivotal moment," "foreshadows," "legendary," "transforms," etc.
- **Stick to facts.** What happened, who did it, what was the consequence
- **Be concise.** Cut unnecessary adjectives and contextual flourishes
- **Example GOOD:** "Marathas capture Gingee from Bijapur. For the next 17 years, it becomes a key Maratha stronghold."
- **Example BAD:** "Marathas capture Gingee from Bijapur, establishing a vital southern outpost amid the expanding Maratha confederacy. This represents a significant step..."

## Dev Commands

```bash
npm run dev     # Start dev server on localhost:3000
npm run build   # Production build (ESLint errors ignored)
npm run start   # Run production build locally
npm run lint    # Run ESLint
```

## Section Rename History
These renames have already been applied to both the data and code:
- "Indian Kingdoms" → "British India Princely States"
- "British India Post 1835" → "British India Uniform Coinage"
- "British India Pre 1835" → "British India Presidencies"
- "Annexed kingdoms" (was a subsection) → "Annexed Kingdoms" (own top-level section)
