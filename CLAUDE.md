# Lavender Coin App - Project Context

## Deployment
- **Production URL**: https://coin-tracker-snowy.vercel.app/
- **Platform**: Vercel
- **Database**: Vercel KV (Redis)

## Project Structure
- Next.js application for cataloging and displaying coin collections
- Coin data stored in `coins-data.json` (source of truth for local development)
- Production data stored in Vercel KV database

## Data Schema
Each coin has the following structure:
- `section`: Main category (e.g., "British India Princely States", "British India Uniform Coinage")
- `subsection`: Subcategory (e.g., "Madras States Agency", "Arcot")
- `subsubsection`: Specific state or location (used for map highlighting)

## Database Migrations
When making changes to coin data structure or section names:
1. Update `coins-data.json` first
2. Update code references in `app/page.tsx` and API routes
3. Create a migration API route in `app/api/migrate-*/route.ts`
4. Run migration via: `curl -X POST https://coin-tracker-snowy.vercel.app/api/migrate-*`

## Recent Section Renames
- "Indian Kingdoms" → "British India Princely States"
- "British India Post 1835" → "British India Uniform Coinage"
- "British India Pre 1835" → "British India Presidencies"
- "Annexed kingdoms" moved from subsection to own "Annexed Kingdoms" section
