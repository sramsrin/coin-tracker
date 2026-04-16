import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import fs from 'fs';

const COINS_KEY = 'coins';

export async function GET() {
  try {
    const backupData = JSON.parse(fs.readFileSync('/tmp/backup_coins.json', 'utf-8'));
    
    // Push the full backup to KV
    await kv.set(COINS_KEY, backupData);

    return NextResponse.json({
      message: 'Database restored from backup',
      totalCoinsRestored: backupData.length
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
