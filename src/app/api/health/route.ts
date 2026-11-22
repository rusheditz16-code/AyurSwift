import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/serverSecurity';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

/**
 * GET /api/health
 * Lightweight uptime & Supabase connectivity check for monitoring (UptimeRobot, Vercel, etc.).
 * Never exposes secrets, schemas, or row contents.
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  // Read searchParams dynamically so Next.js 16 always runs this live at request time
  void request.nextUrl.searchParams.get('ping');

  const supabase = getSupabaseAdminClient();
  let dbStatus: 'ok' | 'degraded' | 'unconfigured' = 'unconfigured';

  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .select('id', { head: true, count: 'estimated' })
        .limit(1);
      dbStatus = error ? 'degraded' : 'ok';
    } catch {
      dbStatus = 'degraded';
    }
  }

  const ok = dbStatus !== 'degraded';
  return NextResponse.json(
    {
      ok,
      status: ok ? 'healthy' : 'degraded',
      db: dbStatus,
      region: process.env.VERCEL_REGION || 'local',
      latencyMs: Date.now() - startedAt,
      ts: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: NO_STORE_HEADERS }
  );
}
