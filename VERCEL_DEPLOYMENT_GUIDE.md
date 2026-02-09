# Deploying to Vercel with Database

## Problem
File-based storage (coins-data.json) doesn't work on Vercel because:
- Vercel has a read-only filesystem
- Serverless functions are stateless and ephemeral

## Solution: Use Vercel KV (Redis)

### Step 1: Set up Vercel KV
1. Go to your Vercel project dashboard
2. Click "Storage" tab
3. Click "Create Database" → "KV"
4. Follow the setup instructions
5. Copy the environment variables it provides

### Step 2: Install dependencies
```bash
npm install @vercel/kv
```

### Step 3: Update your API route
Replace the file-based storage with Vercel KV in `app/api/coins/route.ts`

### Step 4: Migration script
Run this once to upload your existing data:
```bash
node migrate-to-kv.js
```

## Alternative: Use Vercel Postgres or MongoDB Atlas

Both are good options for more complex data needs.

## Quick Fix (Read-only mode)
If you just want to deploy to see your data (without add/edit/delete):
- Keep coins-data.json
- Make API write operations return 501 (Not Implemented) in production
- Data will be read-only but viewable
