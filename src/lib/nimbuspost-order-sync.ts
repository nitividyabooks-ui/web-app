import { Prisma, type NimbusPostOrderSync, type Order, type OrderItem } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { buildNimbusPostOrderInput, getVerifiedNimbusPostProvider, type NimbusPostSnapshot, type VerifiedNimbusPostProvider } from '@/lib/nimbuspost';

export type NimbusPostSyncConfig = {
    enabled: boolean;
    syncFrom: Date | null;
};

export type ConfirmationEvidence = {
    kind: 'RAZORPAY_CAPTURED';
    paymentId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    status: 'captured';
} | {
    kind: 'MANUAL_PREPAID';
    adminId: string;
    reference: string;
    approvedAt: string;
};

type EligibleOrder = Pick<Order, 'id' | 'createdAt' | 'status' | 'paymentMethod' | 'paymentId' | 'razorpayOrderId' | 'totalAmount' | 'currency' | 'meta'>;

// An explicit UTC instant avoids local-time parsing and a moving rollout window.
function parseFixedTimestamp(value: string | undefined): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null;
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return null;
    const normalized = value.includes('.') ? value : value.replace('Z', '.000Z');
    return parsed.toISOString() === normalized ? parsed : null;
}

export function getNimbusPostSyncConfig(env: Record<string, string | undefined> = process.env): NimbusPostSyncConfig {
    const syncFrom = parseFixedTimestamp(env.NIMBUSPOST_SYNC_FROM);
    return {
        enabled: env.NIMBUSPOST_ENABLED === 'true' && env.VERCEL_ENV === 'production' && env.NODE_ENV === 'production' && syncFrom !== null,
        syncFrom,
    };
}

function record(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function hasPrepaidEvidence(order: EligibleOrder, evidence: ConfirmationEvidence): boolean {
    if (evidence.kind === 'RAZORPAY_CAPTURED') {
        return order.paymentMethod === 'RAZORPAY' && evidence.status === 'captured'
            && !!evidence.paymentId && evidence.paymentId === order.paymentId
            && !!evidence.razorpayOrderId && evidence.razorpayOrderId === order.razorpayOrderId
            && evidence.amount === order.totalAmount && evidence.currency === order.currency;
    }
    if (evidence.kind !== 'MANUAL_PREPAID' || order.paymentMethod !== 'WHATSAPP') return false;
    const payment = record(record(order.meta)?.manualPayment);
    return !!evidence.adminId?.trim() && !!evidence.reference?.trim() && parseFixedTimestamp(evidence.approvedAt) !== null
        && payment?.type === 'PREPAID' && payment.approvedBy === evidence.adminId
        && payment.reference === evidence.reference && payment.approvedAt === evidence.approvedAt;
}

/** Call inside the winning confirmation transaction. Provider work happens separately. */
export async function enqueueEligibleOrder(
    tx: Pick<Prisma.TransactionClient, 'nimbusPostOrderSync'>,
    order: EligibleOrder,
    evidence: ConfirmationEvidence,
    config = getNimbusPostSyncConfig(),
): Promise<boolean> {
    if (!config.enabled || !config.syncFrom || order.status !== 'CONFIRMED'
        || !Number.isFinite(order.createdAt.getTime()) || order.createdAt < config.syncFrom
        || !hasPrepaidEvidence(order, evidence)) return false;

    await tx.nimbusPostOrderSync.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, merchantOrderNumber: order.id, paymentType: 'PREPAID', status: 'PENDING' },
        // An already-dispatched, reviewed or synced job must never be reset by repeat confirmation.
        update: {},
    });
    return true;
}

/** Stored confirmation proof is untrusted JSON and must be checked again before export. */
export function getStoredConfirmationEvidence(order: EligibleOrder): ConfirmationEvidence | null {
    const proof = record(record(order.meta)?.confirmationEvidence);
    if (!proof || order.currency !== 'INR' || !Number.isSafeInteger(order.totalAmount) || order.totalAmount <= 0) return null;
    if (proof.kind === 'RAZORPAY_CAPTURED') {
        if (typeof proof.paymentId !== 'string' || !proof.paymentId.trim() || typeof proof.razorpayOrderId !== 'string'
            || !proof.razorpayOrderId.trim() || proof.status !== 'captured' || typeof proof.amount !== 'number' || proof.currency !== 'INR') return null;
    } else if (proof.kind === 'MANUAL_PREPAID') {
        if (typeof proof.adminId !== 'string' || typeof proof.reference !== 'string' || typeof proof.approvedAt !== 'string') return null;
    } else return null;
    const evidence = proof as ConfirmationEvidence;
    return hasPrepaidEvidence(order, evidence) ? evidence : null;
}

const BATCH_LIMIT = 5;
const LEASE_MS = 90_000;
const REQUEST_TIMEOUT_MS = 8_000;
const WORK_BUDGET_MS = 50_000;
const BACKOFF_MS = [60_000, 300_000, 900_000, 3_600_000];
const SAFE_ERRORS = {
    UNKNOWN_OUTCOME: 'Creation may have reached NimbusPost. Verify the merchant reference before resolving.',
    AUTH_REQUIRED: 'NimbusPost credentials or permissions require attention.',
    VALIDATION_REQUIRED: 'The order details require review before export.',
    SNAPSHOT_INVALID: 'The saved request or API contract changed. Review the export before continuing.',
    RETRY_EXHAUSTED: 'Repeated confirmed non-creation failures require review.',
    TRANSIENT_NOT_CREATED: 'NimbusPost confirmed no order was created. A later retry is queued.',
    INELIGIBLE_ORDER: 'This order is no longer eligible for automatic export.',
} as const;
type SafeErrorCode = keyof typeof SAFE_ERRORS;
export type NimbusPostBatchSummary = {
    code: 'DISABLED' | 'PROVIDER_SETUP_REQUIRED' | 'OK' | 'WORKER_FAILED';
    processed: number;
    synced: number;
    retry: number;
    review: number;
    skipped: number;
};

type WorkerOrder = Order & { items: OrderItem[] };
function eligibleForDispatch(order: EligibleOrder | null, config: NimbusPostSyncConfig): order is EligibleOrder {
    return !!order && config.enabled && !!config.syncFrom && order.status === 'CONFIRMED'
        && order.createdAt >= config.syncFrom && getStoredConfirmationEvidence(order) !== null;
}
function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value !== null && typeof value === 'object') {
        return `{${Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
            .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
    }
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error('INVALID_SNAPSHOT');
    return encoded;
}
function hashSnapshot(value: NimbusPostSnapshot): string {
    // PostgreSQL JSONB can reorder object keys; array order still matters.
    return createHash('sha256').update(canonicalJson(value)).digest('hex');
}
function readSnapshot(value: unknown, provider: VerifiedNimbusPostProvider, reference: string): NimbusPostSnapshot | null {
    const snapshot = record(value);
    return snapshot && snapshot.contractId === provider.contractId && snapshot.merchantOrderNumber === reference
        && record(snapshot.request) ? snapshot as NimbusPostSnapshot : null;
}
function verifiedProviderId(value: unknown): value is string {
    return typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 200 && !/[\x00-\x1f\x7f]/.test(value);
}
async function boundedRequest<T>(request: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        // Race enforces the budget even if a transport ignores its AbortSignal.
        return await Promise.race([Promise.resolve().then(() => request(controller.signal)), new Promise<never>((_, reject) => {
            timeout = setTimeout(() => { controller.abort(); reject(new Error('REQUEST_TIMEOUT')); }, timeoutMs);
        })]);
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

/** Durable leases, not a process-local lock, coordinate overlapping serverless invocations. */
export async function runNimbusPostSyncBatch(options: {
    now?: Date;
    limit?: number;
    provider?: VerifiedNimbusPostProvider | null;
    requestTimeoutMs?: number;
} = {}): Promise<NimbusPostBatchSummary> {
    const summary: NimbusPostBatchSummary = { code: 'OK', processed: 0, synced: 0, retry: 0, review: 0, skipped: 0 };
    const config = getNimbusPostSyncConfig();
    if (!config.enabled || !config.syncFrom) return { ...summary, code: 'DISABLED' };
    const provider = options.provider === undefined ? getVerifiedNimbusPostProvider() : options.provider;
    if (!provider) return { ...summary, code: 'PROVIDER_SETUP_REQUIRED' };
    const startedAt = Date.now();
    const baseline = options.now?.getTime() ?? startedAt;
    const clock = () => new Date(baseline + Date.now() - startedAt);
    const limit = Math.min(BATCH_LIMIT, Math.max(1, Number.isFinite(options.limit) ? Math.floor(options.limit!) : BATCH_LIMIT));
    const timeoutMs = Math.min(REQUEST_TIMEOUT_MS, Math.max(1, options.requestTimeoutMs ?? REQUEST_TIMEOUT_MS));
    const beforeDeadline = () => Date.now() - startedAt < WORK_BUDGET_MS - timeoutMs;

    async function finish(job: NimbusPostOrderSync, data: Prisma.NimbusPostOrderSyncUpdateManyMutationInput, undispatchedOnly = false): Promise<boolean> {
        const result = await prisma.nimbusPostOrderSync.updateMany({
            where: { id: job.id, status: 'PROCESSING', leaseToken: job.leaseToken, leaseExpiresAt: { gt: clock() }, ...(undispatchedOnly ? { dispatchStartedAt: null } : {}) },
            data: { ...data, leaseToken: null, leaseExpiresAt: null },
        });
        return result.count === 1;
    }
    async function review(job: NimbusPostOrderSync, code: SafeErrorCode): Promise<void> {
        if (await finish(job, { status: 'REVIEW', lastErrorCode: code, lastErrorSafe: SAFE_ERRORS[code] })) summary.review++;
    }
    async function handleUnknown(job: NimbusPostOrderSync, snapshot: NimbusPostSnapshot | null): Promise<void> {
        // A reliable exact-reference lookup must be documented in the selected account contract.
        if (snapshot && provider!.exactReferenceLookupVerified && provider!.findOrder && beforeDeadline()) {
            try {
                const result = await boundedRequest(signal => provider!.findOrder!(snapshot, signal), timeoutMs);
                if (result?.kind === 'MATCH' && verifiedProviderId(result.providerOrderId)) {
                    if (await finish(job, { status: 'SYNCED', providerOrderId: result.providerOrderId, syncedAt: clock(), lastErrorCode: null, lastErrorSafe: null })) summary.synced++;
                    return;
                }
            } catch { /* Absence, ambiguity and lookup failure are all review-only. */ }
        }
        await review(job, 'UNKNOWN_OUTCOME');
    }

    try {
        // A missed confirmation callback can leave an eligible order without a job.
        const missing = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
            SELECT o.id FROM "Order" o
            WHERE o.status = 'CONFIRMED' AND o."createdAt" >= ${config.syncFrom}
              AND o.currency = 'INR' AND o."totalAmount" > 0
              AND NOT EXISTS (SELECT 1 FROM "NimbusPostOrderSync" j WHERE j."orderId" = o.id)
              AND (
                (o."paymentMethod" = 'RAZORPAY'
                  AND o.meta->'confirmationEvidence'->>'kind' = 'RAZORPAY_CAPTURED'
                  AND o.meta->'confirmationEvidence'->>'status' = 'captured'
                  AND o.meta->'confirmationEvidence'->>'currency' = 'INR'
                  AND length(trim(o."paymentId")) > 0 AND length(trim(o."razorpayOrderId")) > 0
                  AND o.meta->'confirmationEvidence'->'paymentId' = to_jsonb(o."paymentId")
                  AND o.meta->'confirmationEvidence'->'razorpayOrderId' = to_jsonb(o."razorpayOrderId")
                  AND o.meta->'confirmationEvidence'->'amount' = to_jsonb(o."totalAmount"))
                OR (o."paymentMethod" = 'WHATSAPP'
                  AND o.meta->'confirmationEvidence'->>'kind' = 'MANUAL_PREPAID'
                  AND o.meta->'manualPayment'->>'type' = 'PREPAID'
                  AND jsonb_typeof(o.meta->'confirmationEvidence'->'adminId') = 'string'
                  AND jsonb_typeof(o.meta->'confirmationEvidence'->'reference') = 'string'
                  AND jsonb_typeof(o.meta->'confirmationEvidence'->'approvedAt') = 'string'
                  AND length(trim(o.meta->'confirmationEvidence'->>'adminId')) > 0
                  AND length(trim(o.meta->'confirmationEvidence'->>'reference')) > 0
                  AND o.meta->'confirmationEvidence'->'adminId' = o.meta->'manualPayment'->'approvedBy'
                  AND o.meta->'confirmationEvidence'->'reference' = o.meta->'manualPayment'->'reference'
                  AND o.meta->'confirmationEvidence'->'approvedAt' = o.meta->'manualPayment'->'approvedAt'
                  AND CASE WHEN o.meta->'confirmationEvidence'->>'approvedAt' ~
                    '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]([.][0-9]{3})?Z$'
                    THEN substring(o.meta->'confirmationEvidence'->>'approvedAt', 9, 2)::int <=
                      CASE substring(o.meta->'confirmationEvidence'->>'approvedAt', 6, 2)
                        WHEN '02' THEN CASE
                          WHEN substring(o.meta->'confirmationEvidence'->>'approvedAt', 1, 4)::int % 400 = 0
                            OR (substring(o.meta->'confirmationEvidence'->>'approvedAt', 1, 4)::int % 4 = 0
                              AND substring(o.meta->'confirmationEvidence'->>'approvedAt', 1, 4)::int % 100 <> 0)
                          THEN 29 ELSE 28 END
                        WHEN '04' THEN 30 WHEN '06' THEN 30 WHEN '09' THEN 30 WHEN '11' THEN 30 ELSE 31
                      END
                    ELSE FALSE END)

              )
            ORDER BY o."createdAt", o.id LIMIT ${limit}
        `);
        for (const candidate of missing) {
            const order = await prisma.order.findUnique({ where: { id: candidate.id } });
            if (!order) continue;
            const evidence = getStoredConfirmationEvidence(order);
            if (evidence) {
                try { await enqueueEligibleOrder(prisma, order, evidence, config); } catch (error) {
                    // Prisma's empty-update upsert can race with another missing-job reconciler.
                    // Accept only the verified uniqueness winner; never reset or mask other failures.
                    if (record(error)?.code !== 'P2002') throw error;
                    const winner = await prisma.nimbusPostOrderSync.findUnique({ where: { orderId: order.id } });
                    if (!winner || winner.merchantOrderNumber !== order.id) throw error;
                }
            }
        }

        // Before dispatch a dead lease is safe to retry. After dispatch the remote result is unknown.
        const expired = await prisma.nimbusPostOrderSync.findMany({ where: {
            status: 'PROCESSING', leaseExpiresAt: { lte: clock() },
        }, orderBy: { leaseExpiresAt: 'asc' }, take: limit });
        for (const job of expired) {
            const uncertain = job.dispatchStartedAt !== null;
            const snapshot = readSnapshot(job.payloadSnapshot, provider, job.merchantOrderNumber);
            const canLookup = uncertain && provider.exactReferenceLookupVerified && provider.findOrder && snapshot
                && hashSnapshot(snapshot) === job.payloadHash && beforeDeadline();
            const token = canLookup ? randomUUID() : null;
            const result = await prisma.nimbusPostOrderSync.updateMany({
                where: { id: job.id, status: 'PROCESSING', leaseToken: job.leaseToken, leaseExpiresAt: { lte: clock() }, dispatchStartedAt: job.dispatchStartedAt },
                data: { status: canLookup ? 'PROCESSING' : uncertain ? 'REVIEW' : 'RETRY', leaseToken: token,
                    leaseExpiresAt: canLookup ? new Date(clock().getTime() + LEASE_MS) : null, nextAttemptAt: clock(),
                    ...(uncertain ? { lastErrorCode: 'UNKNOWN_OUTCOME', lastErrorSafe: SAFE_ERRORS.UNKNOWN_OUTCOME } : {}) },
            });
            if (result.count === 1 && canLookup) {
                try { await handleUnknown({ ...job, leaseToken: token }, snapshot); } catch { summary.code = 'WORKER_FAILED'; }
            } else if (uncertain && result.count === 1) summary.review++;
        }

        const due = await prisma.nimbusPostOrderSync.findMany({ where: {
            status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: clock() }, providerOrderId: null,
        }, orderBy: { nextAttemptAt: 'asc' }, take: limit });
        for (const candidate of due) {
            if (!beforeDeadline()) break;
            const token = randomUUID();
            const claimed = await prisma.nimbusPostOrderSync.updateMany({
                where: { id: candidate.id, status: candidate.status, nextAttemptAt: { lte: clock() }, providerOrderId: null },
                data: { status: 'PROCESSING', leaseToken: token, leaseExpiresAt: new Date(clock().getTime() + LEASE_MS) },
            });
            if (claimed.count !== 1) continue;
            // The due candidate may predate another worker's safe deferral. Read the
            // row owned by this lease so its frozen body and attempt state stay authoritative.
            const job = await prisma.nimbusPostOrderSync.findUnique({ where: { id: candidate.id } });
            if (!job || job.status !== 'PROCESSING' || job.leaseToken !== token
                || !job.leaseExpiresAt || job.leaseExpiresAt <= clock()) continue;
            summary.processed++;
            try {
                // An improperly reset uncertain job is never dispatched again automatically.
                if (job.dispatchStartedAt) {
                    const snapshot = readSnapshot(job.payloadSnapshot, provider, job.merchantOrderNumber);
                    await handleUnknown(job, snapshot && hashSnapshot(snapshot) === job.payloadHash ? snapshot : null);
                    continue;
                }
                const order = await prisma.order.findUnique({ where: { id: job.orderId }, include: { items: true } });
                if (!eligibleForDispatch(order, config) || job.paymentType !== 'PREPAID') {
                    if (await finish(job, { status: 'SKIPPED', lastErrorCode: 'INELIGIBLE_ORDER', lastErrorSafe: SAFE_ERRORS.INELIGIBLE_ORDER })) summary.skipped++;
                    continue;
                }
                let snapshot: NimbusPostSnapshot | null;
                if (job.payloadSnapshot !== null) {
                    snapshot = readSnapshot(job.payloadSnapshot, provider, job.merchantOrderNumber);
                    if (!snapshot || hashSnapshot(snapshot) !== job.payloadHash) { await review(job, 'SNAPSHOT_INVALID'); continue; }
                } else {
                    try {
                        const input = buildNimbusPostOrderInput(order as WorkerOrder, job.merchantOrderNumber);
                        snapshot = readSnapshot(await boundedRequest(() => provider.buildSnapshot(input), timeoutMs), provider, job.merchantOrderNumber);
                        if (!snapshot) throw new Error('INVALID_SNAPSHOT');
                    } catch { await review(job, 'VALIDATION_REQUIRED'); continue; }
                }
                // Snapshot construction also consumes time. Reserve the complete request budget
                // again before recording dispatch, leaving time for the final database write.
                if (!beforeDeadline()) {
                    if (await finish(job, { status: 'RETRY', nextAttemptAt: clock(), payloadSnapshot: snapshot, payloadHash: hashSnapshot(snapshot) }, true)) summary.retry++;
                    continue;
                }
                const dispatchAt = clock();
                const dispatch = await prisma.nimbusPostOrderSync.updateMany({
                    where: { id: job.id, status: 'PROCESSING', leaseToken: token, leaseExpiresAt: { gt: dispatchAt }, dispatchStartedAt: null,
                        order: { status: 'CONFIRMED', createdAt: { gte: config.syncFrom } } },
                    data: { payloadSnapshot: snapshot, payloadHash: hashSnapshot(snapshot), lastAttemptAt: dispatchAt, dispatchStartedAt: dispatchAt, attemptCount: { increment: 1 } },
                });
                if (dispatch.count !== 1) {
                    if (await finish(job, { status: 'SKIPPED', lastErrorCode: 'INELIGIBLE_ORDER', lastErrorSafe: SAFE_ERRORS.INELIGIBLE_ORDER })) summary.skipped++;
                    continue;
                }
                // No open transaction spans this provider request.
                const result = await boundedRequest(signal => provider.createOrder(snapshot!, signal), timeoutMs);
                if (result?.kind === 'CREATED' && verifiedProviderId(result.providerOrderId)) {
                    if (await finish(job, { status: 'SYNCED', providerOrderId: result.providerOrderId, syncedAt: clock(), lastErrorCode: null, lastErrorSafe: null })) summary.synced++;
                } else if (result?.kind === 'NOT_CREATED' && ['TRANSIENT', 'AUTH', 'VALIDATION'].includes(result.reason)) {
                    const attempts = job.attemptCount + 1;
                    const retryAfterMs = result.retryAfterSeconds === undefined ? 0 : result.retryAfterSeconds * 1000;
                    const delay = Math.max(BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)], retryAfterMs);
                    const retryAt = new Date(clock().getTime() + delay);
                    if (result.reason === 'TRANSIENT' && attempts <= BACKOFF_MS.length && Number.isFinite(retryAt.getTime()) && retryAfterMs >= 0) {
                        if (await finish(job, { status: 'RETRY', dispatchStartedAt: null, nextAttemptAt: retryAt,
                            lastErrorCode: 'TRANSIENT_NOT_CREATED', lastErrorSafe: SAFE_ERRORS.TRANSIENT_NOT_CREATED })) summary.retry++;
                    } else {
                        const code = result.reason === 'AUTH' ? 'AUTH_REQUIRED' : result.reason === 'VALIDATION' ? 'VALIDATION_REQUIRED' : 'RETRY_EXHAUSTED';
                        // The adapter guarantees absence for this outcome; preserve safe-retry evidence.
                        if (await finish(job, { status: 'REVIEW', dispatchStartedAt: null, lastErrorCode: code, lastErrorSafe: SAFE_ERRORS[code] })) summary.review++;
                    }
                } else await handleUnknown(job, snapshot);
            } catch {
                // This includes a successful remote create followed by a failed database save.
                // If the database is unavailable, the dispatch marker survives for expired-lease recovery.
                try { await review(job, 'UNKNOWN_OUTCOME'); } catch { summary.code = 'WORKER_FAILED'; }
            }
        }
    } catch {
        summary.code = 'WORKER_FAILED';
    }
    return summary;
}

export const NIMBUSPOST_STATUS_LABELS = { PENDING: 'Queued', PROCESSING: 'Syncing', RETRY: 'Queued for retry', SYNCED: 'Synced', REVIEW: 'Needs review', SKIPPED: 'Skipped' } as const;
export { SAFE_ERRORS as NIMBUSPOST_SAFE_ERRORS };
