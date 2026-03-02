# Lavender Coin App - Project Context

## Deployment
- **Production URL**: https://coin-tracker-snowy.vercel.app/
- **Platform**: Vercel
- **Database**: Vercel KV (Redis)

## Project Structure
- Next.js application for cataloging and displaying coin collections
- **All coin data lives in the Vercel KV database** (the single source of truth)
- There is NO local coins-data.json file — it was removed to avoid sync issues

## Data Schema
Each coin has the following structure:
- `section`: Main category (e.g., "British India Princely States", "British India Uniform Coinage")
- `subsection`: Subcategory (e.g., "Madras States Agency", "Arcot")
- `subsubsection`: Specific state or location (used for map highlighting)

## Modifying Coin Data
**IMPORTANT**: All coin data changes MUST be made directly to the Vercel KV database. Do NOT create a local coins-data.json file.

To read current data from KV:
```bash
curl -s https://coin-tracker-snowy.vercel.app/api/coins -o /tmp/coins.json
```

To write updated data back to KV:
```bash
curl -X POST https://coin-tracker-snowy.vercel.app/api/migrate-coins -H "Content-Type: application/json" -d "{\"coins\": $(cat /tmp/coins.json)}"
```

For structural changes (section renames, new fields, etc.):
1. Fetch current data from KV
2. Modify the data
3. Push updated data back to KV
4. Update code references in `app/page.tsx` and API routes as needed

## Recent Section Renames
- "Indian Kingdoms" → "British India Princely States"
- "British India Post 1835" → "British India Uniform Coinage"
- "British India Pre 1835" → "British India Presidencies"
- "Annexed kingdoms" moved from subsection to own "Annexed Kingdoms" section
