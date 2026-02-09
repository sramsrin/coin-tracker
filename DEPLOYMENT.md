# Deploy to Vercel with Working Edit Functionality

## Why Edit Doesn't Work on Vercel

Your app works on localhost but editing fails on Vercel because:
- **Localhost**: Can read/write to `coins-data.json` file
- **Vercel**: Read-only filesystem - can READ the file but cannot WRITE to it

**Solution**: Use Upstash Redis (Vercel's recommended database)

---

## Complete Setup Guide (5 minutes)

### 1. Create Upstash Redis Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Click **Storage** tab
4. Click **Create Database** → Choose **Upstash Redis**
5. Click **Continue** and follow the prompts
6. Vercel will automatically add environment variables to your project

### 2. Files Already Prepared

I've created these files for you:
- `app/api/coins/route.kv.ts` - New API route using Redis
- `migrate-to-kv.js` - Script to upload your existing data

### 3. Replace the API Route

**Option A: Rename files (recommended)**
```bash
cd /Users/sahanavasanth/Desktop/LavenderCoinApp
mv app/api/coins/route.ts app/api/coins/route.old.ts
mv app/api/coins/route.kv.ts app/api/coins/route.ts
```

**Option B: Copy the new code**
Copy the contents of `route.kv.ts` into `route.ts`

### 4. Set Up Environment Variables (for local testing)

Create a `.env.local` file:
```bash
# Get these from Vercel dashboard → Storage → Your Redis → .env.local tab
KV_URL=your_kv_url_here
KV_REST_API_URL=your_api_url_here
KV_REST_API_TOKEN=your_token_here
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token_here
```

### 5. Migrate Your Data

Run this ONCE to upload your existing coins to Redis:
```bash
node migrate-to-kv.js
```

You should see:
```
Found 198 coins to migrate...
✓ Successfully migrated coins to Vercel KV!
✓ 198 coins uploaded
✓ Verified: 198 coins in KV
```

### 6. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test editing - should work!

### 7. Deploy to Vercel

```bash
git add .
git commit -m "Add Redis database support"
git push
```

Or use Vercel CLI:
```bash
vercel --prod
```

---

## Verification

After deployment:
1. Visit your Vercel URL
2. Login with password: `SRMPv7006@`
3. Try editing a coin - should work now! ✓
4. Try adding a new coin - should work! ✓
5. Try deleting a coin - should work! ✓

---

## Troubleshooting

### Error: "KV_REST_API_URL is not defined"
- Make sure you created the Upstash Redis database in Vercel
- Check that environment variables are set in Vercel dashboard

### Migration script fails
- Make sure `.env.local` has the correct credentials
- Run `npm install @vercel/kv` first

### Data not showing after migration
- The migration might need to run from a deployed function
- Alternative: Use the Upstash Redis dashboard to manually import your JSON

---

## Why This Works

**Before (Localhost only)**:
- API route writes to `coins-data.json` file
- Works locally, fails on Vercel (read-only filesystem)

**After (Works everywhere)**:
- API route writes to Redis database
- Works locally AND on Vercel (persistent database)

---

## Cost

- **Upstash Redis Free Tier**: 10,000 commands/day
- Your app will use ~1-5 commands per page load
- More than enough for personal use (free forever!)
