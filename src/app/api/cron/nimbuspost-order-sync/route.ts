import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/admin-session';
import { runNimbusPostSyncBatch } from '@/lib/nimbuspost-order-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
    if (!isAuthorizedCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await runNimbusPostSyncBatch();
    return NextResponse.json(result, { status: ['WORKER_FAILED', 'PROVIDER_SETUP_REQUIRED'].includes(result.code) ? 503 : 200 });
}
