import { prisma } from '@/lib/prisma';
import { getCurrentAdmin, assertSameOrigin } from '@/lib/admin-session';
import { getNimbusPostSyncConfig, getStoredConfirmationEvidence, NIMBUSPOST_SAFE_ERRORS } from '@/lib/nimbuspost-order-sync';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
const safeText = z.string().trim().min(1).max(200).regex(/^[^\x00-\x1f\x7f]+$/);
const base = { expectedUpdatedAt: z.iso.datetime() };
const actionSchema = z.discriminatedUnion('action', [
    z.object({ ...base, action: z.literal('retry') }).strict(),
    z.object({ ...base, action: z.literal('resolve_existing'), merchantOrderNumber: safeText, providerOrderId: safeText, confirmedMatch: z.literal(true) }).strict(),
    z.object({ ...base, action: z.literal('resolve_absent'), merchantOrderNumber: safeText, confirmedAbsent: z.literal(true) }).strict(),
]);
function validId(id: string) { return /^[A-Za-z0-9_-]{1,128}$/.test(id); }
function response(code: string, status: number) { return Response.json({ code }, { status, headers: { 'Cache-Control': 'no-store' } }); }
class RecoveryConflict extends Error {}

export async function GET(request: Request, context: Context) {
    if (!await getCurrentAdmin(request)) return response('UNAUTHORIZED', 401);
    const { id } = await context.params;
    if (!validId(id)) return response('INVALID_REQUEST', 400);
    const order = await prisma.order.findUnique({ where: { id }, select: { nimbusPostSync: { select: {
        status: true, merchantOrderNumber: true, providerOrderId: true, attemptCount: true, lastAttemptAt: true, dispatchStartedAt: true,
        syncedAt: true, nextAttemptAt: true, updatedAt: true, lastErrorCode: true,
    } } } });
    if (!order) return response('NOT_FOUND', 404);
    const job = order.nimbusPostSync;
    return Response.json({ sync: job ? { status: job.status, merchantOrderNumber: job.merchantOrderNumber, providerOrderId: job.providerOrderId, attemptCount: job.attemptCount, lastAttemptAt: job.lastAttemptAt, dispatchStartedAt: job.dispatchStartedAt, syncedAt: job.syncedAt, nextAttemptAt: job.nextAttemptAt, updatedAt: job.updatedAt, lastErrorCode: job.lastErrorCode && Object.hasOwn(NIMBUSPOST_SAFE_ERRORS, job.lastErrorCode) ? job.lastErrorCode : null } : null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, context: Context) {
    const admin = await getCurrentAdmin(request);
    if (!admin) return response('UNAUTHORIZED', 401);
    try { assertSameOrigin(request); } catch { return response('FORBIDDEN', 403); }
    const { id } = await context.params;
    if (!validId(id)) return response('INVALID_REQUEST', 400);
    const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') || request.headers.get('content-type')?.includes('multipart/form-data');
    let body: unknown;
    try {
        if (isForm) {
            const form = await request.formData();
            body = Object.fromEntries(form);
            const values = body as Record<string, unknown>;
            if ('confirmedMatch' in values) values.confirmedMatch = values.confirmedMatch === 'yes';
            if ('confirmedAbsent' in values) values.confirmedAbsent = values.confirmedAbsent === 'yes';
        } else body = await request.json();
    } catch { return response('INVALID_REQUEST', 400); }
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return response('INVALID_REQUEST', 400);
    const action = parsed.data;
    try {
        await prisma.$transaction(async tx => {
            const order = await tx.order.findUnique({ where: { id }, include: { nimbusPostSync: true } });
            const job = order?.nimbusPostSync;
            if (!order || !job || job.status === 'PROCESSING' || job.status === 'SYNCED' || job.leaseToken || job.providerOrderId
                || job.updatedAt.toISOString() !== action.expectedUpdatedAt) throw new RecoveryConflict();
            const config = getNimbusPostSyncConfig();
            const mayRetry = config.enabled && config.syncFrom && order.status === 'CONFIRMED' && order.createdAt >= config.syncFrom && getStoredConfirmationEvidence(order);
            if (action.action === 'retry') {
                if (!mayRetry || job.dispatchStartedAt || !['RETRY', 'REVIEW', 'SKIPPED'].includes(job.status)) throw new RecoveryConflict();
            } else {
                if (job.status !== 'REVIEW' || action.merchantOrderNumber !== job.merchantOrderNumber) throw new RecoveryConflict();
                if (action.action === 'resolve_absent' && (!mayRetry || !job.dispatchStartedAt)) throw new RecoveryConflict();
            }
            const now = new Date();
            const nextVersion = new Date(Math.max(now.getTime(), job.updatedAt.getTime() + 1));
            if (order.meta !== null && (typeof order.meta !== 'object' || Array.isArray(order.meta))) throw new RecoveryConflict();
            const meta = order.meta && typeof order.meta === 'object' && !Array.isArray(order.meta) ? order.meta : {};
            const audit: Prisma.InputJsonObject = { action: action.action, approvedBy: admin.id, approvedAt: now.toISOString(), merchantOrderNumber: job.merchantOrderNumber,
                ...(action.action === 'resolve_existing' ? { providerOrderId: action.providerOrderId, confirmedMatch: true } : action.action === 'resolve_absent' ? { confirmedAbsent: true } : {}) };
            const previous = meta.nimbusPostResolutions === undefined ? [] : Array.isArray(meta.nimbusPostResolutions) ? meta.nimbusPostResolutions : [meta.nimbusPostResolutions];
            // Lock the order's status/version before changing its export; cancellation wins or rolls this back.
            const locked = await tx.order.updateMany({ where: { id, status: order.status, updatedAt: order.updatedAt }, data: { meta: { ...meta, nimbusPostResolutions: [...previous, audit] } as Prisma.InputJsonObject } });
            if (locked.count !== 1) throw new RecoveryConflict();
            const changed = await tx.nimbusPostOrderSync.updateMany({ where: { id: job.id, status: job.status, updatedAt: job.updatedAt, leaseToken: null, dispatchStartedAt: job.dispatchStartedAt, providerOrderId: null }, data: action.action === 'resolve_existing'
                ? { updatedAt: nextVersion, status: 'SYNCED', providerOrderId: action.providerOrderId, syncedAt: now, leaseToken: null, leaseExpiresAt: null, lastErrorCode: null, lastErrorSafe: null }
                : { updatedAt: nextVersion, status: 'RETRY', dispatchStartedAt: null, nextAttemptAt: now, leaseToken: null, leaseExpiresAt: null, lastErrorCode: null, lastErrorSafe: null } });
            if (changed.count !== 1) throw new RecoveryConflict();
        });
        revalidatePath(`/admin/orders/${id}`); revalidatePath('/admin/orders');
        return isForm ? Response.redirect(new URL(`/admin/orders/${id}?nimbuspost=updated`, request.url), 303) : response('UPDATED', 200);
    } catch (error) {
        const conflict = error instanceof RecoveryConflict || (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002');
        if (isForm && conflict) return Response.redirect(new URL(`/admin/orders/${id}?nimbuspost=changed`, request.url), 303);
        return response(conflict ? 'RELOAD_AND_VERIFY' : 'RECOVERY_FAILED', conflict ? 409 : 500);
    }
}
