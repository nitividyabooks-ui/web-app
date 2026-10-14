# NimbusPost Order Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically create an unshipped NimbusPost order for each newly confirmed eligible website order, while the owner chooses the courier and books the shipment in NimbusPost.

**Architecture:** Use the existing PostgreSQL database as a durable outbox, with one sync job per website order. Confirmation and enqueue happen in one transaction; a protected scheduled worker creates the NimbusPost order independently of checkout, records the provider reference, and exposes failures for admin review. Do not select couriers, generate AWBs or labels, request pickup, or call shipment-booking endpoints.

**Tech Stack:** Existing Next.js 16 Route Handlers and Server Actions, TypeScript, Prisma 5/PostgreSQL, Node crypto, fetch, Zod, Playwright; Vercel Cron if the current account's schedule limits meet the agreed service interval. No Redis, Kafka, queue service, or new runtime dependency is proposed.

---

## Approved scope and decision

The owner chose **“Create orders only; I choose courier/book shipments.”** This document is a plan, not authorization to make live provider requests, modify production data, migrate, or deploy. Planning creates only this file. Implementation begins after the owner accepts the concrete plan and the account contract prerequisites below are resolved; production deployment follows the repository's existing explicit push confirmation rule.

Recommended approach: **PostgreSQL outbox plus protected scheduled worker.** It adds one small table and worker, survives process termination, supports safe retries, and keeps shipping-provider failures out of payment responses. An inline NimbusPost call needs fewer files but delays checkout and cannot reliably recover after a timeout or a serverless invocation ends. An external automation service avoids building a scheduler, but adds a vendor, customer-data routing, and a second failure/debugging surface; no configured automation was found. At current order volume, the database approach fits the existing application.

Phase 1 creates orders only and adds no new customer-facing COD offering. Current Razorpay and WhatsApp checkout choices remain unchanged; manual WhatsApp prepaid confirmation is the primary owner approval path. Handle an existing COD arrangement only if actually used, explicitly approved, and representable by the verified API. Phase 2—tracking updates, AWBs, labels, automatic courier choice, pickup booking, wallet spending, and remote cancellation—is a separate proposal requiring explicit approval. No remote deletion or cancellation is performed when a synced website order changes or is cancelled; show an admin notice to handle it in NimbusPost.

## Baseline implementation evidence at planning

Paths below are absolute, under `/Users/cars24/Desktop/Personal-Projects/NitiVidya`.

- `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/orders/create/route.ts` stores the order, discounted item prices, authoritative payable total, and `meta.shippingAmount`; initial status is `PENDING_PAYMENT` or `PENDING_WHATSAPP`. It sends business notifications but makes no NimbusPost call.
- `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/payment/verify/route.ts` and `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/payment/status/[id]/route.ts` confirm captured Razorpay payments with order/amount/currency checks. Each has its own database transition.
- `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/webhooks/razorpay/route.ts` is another confirmation path. Before using it as a shipping trigger, repair its acceptance of `payment.authorized`, missing webhook secrets, notes-based order matching without stored binding checks, and `order.paid` confirmation without verified captured payment evidence. It currently acknowledges processing failures with HTTP 200, preventing reliable retries.
- `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/admin/(dashboard)/orders/[id]/page.tsx` changes order status directly through a Server Action. It currently provides no explicit prepaid/COD confirmation evidence.
- `/Users/cars24/Desktop/Personal-Projects/NitiVidya/prisma/schema.prisma` defines `PENDING_WHATSAPP`, `PENDING_PAYMENT`, `PAYMENT_FAILED`, `CONFIRMED`, `CANCELLED`, `SHIPPED`, and `FULFILLED`. Do not introduce imaginary `PROCESSING` or `DELIVERED` statuses. No shipping-provider identifier or durable sync job exists.
- `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/admin/login/route.ts` issues an unsigned admin ID cookie. `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/middleware.ts` checks cookie presence and excludes `/api/`. Neither is sufficient authorization for new sync/retry/COD approval actions.
- No `vercel.json`, example environment file, or scheduled worker was found. `/Users/cars24/Desktop/Personal-Projects/NitiVidya/tests/e2e/commerce-regressions.spec.ts` already runs actual route logic with mocked Prisma, provider, and notification dependencies. Follow that pattern for new isolated tests.
- A missing production `BlogPost` table is already recorded in `/Users/cars24/Desktop/Personal-Projects/NitiVidya/.claude/memory/deploy.md`. It is unrelated to this feature and must not be silently repaired or included in its migration.

## Prerequisites and provider contract gate

Resolve these before implementing the live adapter; other isolated work can proceed with typed fixtures and mocked providers.

1. Pin the account-linked **v2 order-only** contract recorded below. Obtain its API key ID and secret through secure runtime configuration, never chat, source control, or logs. Earlier legacy/Partner shipment documentation was planning evidence only and is not the selected contract; shipment creation is not a substitute for order-only import.
2. Confirm the documented successful response and persistent NimbusPost order ID field, validation errors, authentication errors, rate limits, and timeout behavior. Do not infer the response shape or treat HTTP 200 alone as creation success.
3. The selected v2 contract documents exact order-number filtering and reference uniqueness per sales channel, but no idempotency header or lookup-visibility guarantee. Reconcile only one verified exact match; empty, duplicate, incomplete, or uncertain results require review, not automatic recreation. Exact-once remote creation cannot be promised.
4. Validate the v2 rupee fields against authoritative website paise values. Preserve ₹174 goods + ₹49 shipping = ₹223 paid/payable: stored discounted unit sale prices go into `items[].price`, ₹49 into `org_charges.shipping_charges`, and ₹223 into declared `order_amount`. A genuine approved COD arrangement additionally requires `order_collectable_amount: 223`; prepaid uses `payment_mode: "prepaid"`. Do not double-apply discounts or invent a shipping SKU. This replaces the earlier legacy subtotal interpretation.
5. Validate v2 full-name/address rules and numeric phone/pincode fields below. Omit optional warehouse/package fields unless owner-approved real values are configured. Omitted warehouse creates a draft awaiting owner selection; omitted package uses provider defaults that the owner must verify before booking. Never invent package measurements.
6. Check the actual Vercel plan and available cron frequency. Agree the maximum acceptable order-sync delay. If its allowed interval is too long, choose an authenticated external scheduler or an approved plan change before launch; do not promise a minute-by-minute schedule or silently buy anything.
7. Choose the enable timestamp and staged launch scope. Existing historical orders, including the four previously reviewed records, remain excluded. Any historical import is a separate explicit, per-order opt-in.

**Historical planning evidence, not the selected contract:** Public legacy custom-order documentation described `POST https://ship.nimbuspost.com/api/orders/create` with `NP-API-KEY`, separate `fname`/`lname`, and an `amount` merchandise subtotal. Read-only listing/detail operations existed without documented exact-reference or duplicate guarantees. Its `/orders/autoship_order` and `/orders/ship` shipment endpoints remain forbidden in this phase. [Official legacy order-only collection](https://documenter.getpostman.com/view/9692837/SWE6beC7#1318e2f9-0ef6-4571-a71f-da4d22b665bd), [earlier Partner shipment collection](https://documenter.getpostman.com/view/9692837/TW6wHnoz).

The [API key guide](https://nimbuspost.freshdesk.com/support/solutions/articles/1060000155399-what-are-api-keys-and-why-do-i-need-them-), [integration page](https://nimbuspost.com/channel-integrations/), and [legacy PHP client](https://github.com/tech-nimbuspost/nimbuspost-api/blob/main/src/ServerCall/NimbuspostClient.php) were earlier research and did not establish this account's contract. They are superseded for this implementation by the account-linked v2 reference below.

### Selected account-linked v2 contract — confirmed 2026-10-14 IST

The actual account's Settings → API Keys page links **View API Documentation** to [NimbusPost v2 reference](https://api-v2.nimbuspost.com/docs/reference/v2). Its published OpenAPI 3.1 specification identifies version `2.0.0`; the clean public document was extracted locally to `/tmp/nimbuspost-v2-openapi.json` for implementation review. It contains documentation examples, not account secrets.

- Fixed production host: `https://api-v2.nimbuspost.com`. Send JSON with `Content-Type`/`Accept: application/json` and both `x-api-key` (ID starting `npk_`) and `x-api-secret`. Keys require the **admin** role for writes; viewer is read-only. Customer-data response access can remain off because order ID/reference fields are unmasked. The secret appears once when created/rotated; no key or secret has been created or retrieved yet.
- **Create only:** `POST /v2/orders`, `order_type: "b2c"`, `payment_mode: "prepaid"` or approved `"cod"`. A documented `201` envelope has `success: true` and `data.order_id`, `data.order_number`, and `data.order_status`. This saves an unbooked order. `/v2/shipments`, `/v2/shipments/book`, pickup, label, cancellation, and wallet actions are outside scope and must not be called.
- All order money is in numeric rupees. Send stored discounted unit prices and quantities, separate `org_charges.shipping_charges`, and the full declared `order_amount`; ₹174 + ₹49 maps to ₹223, and the ₹500 bundle has zero shipping. Do not apply the already-stored discount again. COD requires a positive `order_collectable_amount` no greater than the full order total. The old legacy `amount` subtotal field is not used.
- `shipping_address.name` is one full-name string, supporting mononyms. Required delivery fields are name/address/city/state plus numeric ten-digit phone and six-digit pincode. Address is at most 200 characters, state at most 50 without digits, and optional valid email at most 100. Merchant `order_number` is at most 50 letters/digits/`-`/`#`, unique per sales channel; each API key binds to an API sales channel. Preserve that binding and do not override `channel_id` casually.
- `GET /v2/orders` documents an `order_number` filter and cursor pagination. Use bounded exact-reference lookup to accept only a single verified provider ID; duplicates, empty results, an unfinished page cursor, and any uncertain response remain `REVIEW`. No documented idempotency header or read-after-write visibility guarantee makes an empty lookup proof of absence.
- Documented `429` is explicitly not processed and can retry after `Retry-After`. Authentication/role `401`/`403` and validated `422` rejections are noncreation failures requiring correction. Treat unknown responses, transport failures, and `5xx` as uncertain despite generic provider retry guidance; review/reconcile before any recreate.
- Omitting optional `warehouse_id` saves a draft that needs owner warehouse selection before booking. Omitting optional package fields uses provider defaults of 0.25 kg and 10 × 10 × 10 cm; the owner must replace/verify actual packed weight and dimensions before booking. No invented parcel measurements enter our request.

## Data model, eligibility, and delivery behavior

Add one `NimbusPostOrderSync` table related to `Order`; keep the website's order and payment states unchanged. Proposed minimal fields:

| Field | Purpose |
|---|---|
| `id`, `orderId @unique`, relation to `Order` | One durable job for an order, across all confirmation paths |
| `merchantOrderNumber @unique` | Stable reference derived from the internal ID, subject to the verified API length/character rules |
| `status` | `PENDING`, `PROCESSING`, `RETRY`, `SYNCED`, `REVIEW`, or `SKIPPED` |
| `paymentType` | Explicit `PREPAID` or `COD`; never inferred from “WhatsApp” |
| `providerOrderId String? @unique` | Successful NimbusPost creation/reconciliation identifier |
| `payloadSnapshot Json?`, `payloadHash String?` | Freeze the validated request before dispatch so retries do not silently change customer details/prices |
| `attemptCount`, `nextAttemptAt`, `leaseToken`, `leaseExpiresAt` | Bounded retry state and compare-and-set worker ownership |
| `dispatchStartedAt`, `lastAttemptAt DateTime?`, `syncedAt` | Distinguish an undispatched job from an uncertain remote attempt and retain the latest attempt time after its lease is cleared |
| `lastErrorCode`, `lastErrorSafe`, `createdAt`, `updatedAt` | Safe operational history, without secrets or raw provider payloads |

Store only necessary customer/shipping data in the snapshot, under the same database access controls as orders. Do not log the snapshot, full addresses, customer phone/email, credential headers, or provider responses. Use an index on `(status, nextAttemptAt)` for claiming due work. No event-bus or extra order-history table is needed.

Eligibility:

- Integration is explicitly enabled for production and `order.createdAt` is at/after the fixed rollout timestamp. Missing/invalid `NIMBUSPOST_ENABLED` or `NIMBUSPOST_SYNC_FROM` disables enqueue/dispatch safely without throwing from payment confirmation. Never substitute a moving `now` cutoff; a valid fixed timestamp is required.
- Current status is `CONFIRMED`; pending, failed, cancelled, already shipped, and fulfilled orders are not exported.
- Razorpay prepaid orders have verified captured payment evidence, bound to the stored provider order and matching total/currency.
- WhatsApp is a conversation channel, not a payment type. The admin records verified manual prepaid payment with its receipt/reference, approver, and time. For an existing genuine COD arrangement only, the admin explicitly approves **COD**; this does not add COD sales or checkout availability. Save this evidence in existing order `meta`; never fabricate a Razorpay `paymentId` for a manual transfer. An old “confirmed” record without payment evidence is insufficient.
- Product quantities, order item sale prices, shipping total, address, and payment type pass the verified NimbusPost contract validation.

Core interfaces, kept local to this integration:

```typescript
confirmOrderAndEnqueue(tx, orderId, confirmationEvidence): Promise<ConfirmationResult>
enqueueEligibleOrder(tx, order, evidence): Promise<void>
runNimbusPostSyncBatch({ now, limit }): Promise<BatchSummary>
createNimbusPostOrder(snapshot): Promise<CreatedOrder | RejectedOrder | UnknownOutcome>
```

Confirmation pseudocode:

```text
transaction:
  compare-and-set the expected pending order to CONFIRMED with payment evidence
  insert sync job if enabled + newly eligible (unique orderId prevents duplicates)
commit
return checkout/webhook response
```

Do not call NimbusPost in this transaction or in a checkout response. Notifications remain separate from durable shipping state. Add bounded reconciliation for eligible confirmed orders created after the rollout cutoff but lacking a job, using `upsert`/unique constraints; this covers interrupted deployments or older missed enqueue paths without exporting historical orders.

Worker behavior:

1. Authenticate the invocation, verify production feature flag, reconcile eligible missing jobs, and claim a small due batch atomically. Lease ownership tokens must guard every final update; a second worker must not dispatch the same lease.
2. Recheck current order eligibility before first dispatch. Freeze the verified payload and deterministic reference, persist that dispatch is starting, then make the remote call with a timeout below the function's duration limit. No database transaction or connection remains open during the network call.
3. On documented success, persist the verified provider ID and `SYNCED`. Creating an unshipped NimbusPost order does **not** change website status to `SHIPPED`.
4. On a provably safe rejection/transient response, classify by the verified provider contract. Only documented requests that did not create an order enter `RETRY`; use bounded backoff (initial proposal 1, 5, 15, 60 minutes, then `REVIEW`, constrained by actual worker schedule). Authentication/configuration failures pause processing for review; invalid customer data requires correction, not repeated requests.
5. A timeout, dropped connection, unexpected response, server error with uncertain side effects, remote success followed by a database-save failure, or lease expiring after dispatch may mean the provider already created the order. Reconcile the exact merchant reference only if documented and reliable. If exactly one verified matching order exists, save its ID. If missing/ambiguous/unsupported, mark `REVIEW`; do **not** blindly create again.
6. An admin may resolve `REVIEW` by recording an existing provider order ID verified against the merchant reference, or explicitly confirming remote absence before retry. The UI must explain uncertainty. Automatic retry is not a solution to unknown provider state.
7. Cancellation before first dispatch makes the job `SKIPPED`. Once dispatch began, retain the uncertainty record and reconcile/review; never describe a possibly created remote order as safely absent. Cancellation or edits after sync display a manual NimbusPost follow-up.

Implementation dependency order: **Task 1 → Task 2 → Task 4 → Task 3 → Task 5 → Task 6 → Task 7**. Task 4 establishes signed authorization before Task 3 changes owner confirmation actions. These are future implementation steps; no code, migration, commit, deployment, or provider order is created by this planning request.

## Task 1: Pin the API contract and launch settings

**Files:** Modify this plan only until the contract gate is satisfied. During implementation, create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/lib/nimbuspost.ts` and add fixtures/tests in `/Users/cars24/Desktop/Personal-Projects/NitiVidya/tests/e2e/nimbuspost-order-sync.spec.ts`.

1. Read the account-supported official create-only and read-only contracts; record the selected host/version/auth method, required fields, successful ID shape, and error classifications in the adapter comments and typed test fixtures.
2. Define configuration names: `NIMBUSPOST_ENABLED`, `NIMBUSPOST_SYNC_FROM`, separate v2 API key-ID and API-secret variables, `CRON_SECRET`, and `ADMIN_SESSION_SECRET`. Record the final pair's variable names after adapter review and set values only in runtime environment management. Restrict the API base URL in code to the verified host; do not accept arbitrary hosts from requests.
3. Write failing v2 fixture tests for ₹174 item goods + ₹49 `org_charges.shipping_charges` and ₹223 declared `order_amount`, matching website receipt, verified COD collectible mapping, the ₹500 five-book set with no shipping, rupees/paise conversion, prepaid/COD values, item quantities, and a single-word name. Add a test rejecting an unsupported COD collectible representation or an unrecognized success response.
4. Run `npx playwright test tests/e2e/nimbuspost-order-sync.spec.ts --project=desktop --grep 'contract|payload'`; expect failures for absent adapter behavior, then implement only the pure mapper/response parser and rerun to pass. Provider requests remain mocked.
5. Contract acceptance gate: if shipping representation, response ID, or order-only behavior is unresolved, stop before enabling live creation and surface the exact unanswered requirement.

## Task 2: Add durable sync state with an isolated migration

**Files:** Modify `/Users/cars24/Desktop/Personal-Projects/NitiVidya/prisma/schema.prisma`; create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/prisma/migrations/<generated_timestamp>_add_nimbuspost_order_sync/migration.sql`; extend `/Users/cars24/Desktop/Personal-Projects/NitiVidya/tests/e2e/nimbuspost-order-sync.spec.ts`.

1. Write tests for one job per order, default pending state, due-job selection, exclusion of historical/pending/unpaid WhatsApp orders, missing/invalid enable configuration, and cancellation before dispatch.
2. Add the single model, relation, status enum, unique constraints, and due-job index above. Do not add shipping-booking fields or unrelated schema changes.
3. Generate/test the migration only on an explicitly verified disposable development database: `DATABASE_URL="$NIMBUSPOST_TEST_DATABASE_URL" npx prisma migrate dev --name add_nimbuspost_order_sync`. Abort if that variable is unset or points at production. Existing `.env` files point at production and must not be used for this step.
4. Run `npx prisma validate` and `npx prisma generate`; inspect the SQL. It must affect only this feature's table, enum, indexes, and relation. If Prisma proposes resetting the database or adding unrelated `BlogPost` changes, stop and resolve migration history separately—never `db push`, reset, or broad repair against production.
5. In the same proposed Playwright test file, add one opt-in integration test against the verified disposable database using the existing Prisma client: concurrently insert the same order job and race two worker claims, then assert one unique row and one successful compare-and-set lease. Guard the test against unset, pooled production, or known production database URLs; require an explicit disposable-test opt-in. Use separately prefixed test order/job IDs and delete only those fixtures in `finally`; never truncate/reset tables. Run only after those guards pass: `NIMBUSPOST_DISPOSABLE_DB_TEST=1 DATABASE_URL="$NIMBUSPOST_TEST_DATABASE_URL" npx playwright test tests/e2e/nimbuspost-order-sync.spec.ts --project=desktop --grep 'disposable database contention'`. This validates real SQL uniqueness and compare-and-set semantics alongside the fast mocked tests without adding a framework.
6. Verify migration rollback strategy: additive table can remain unused with feature disabled; do not destroy synced evidence during rollback. Production migration uses the approved migration deployment connection, not an assumed PgBouncer endpoint.

## Task 3: Make confirmation evidence trustworthy and enqueue atomically

**Files:** Create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/lib/order-confirmation.ts`; modify `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/payment/verify/route.ts`, `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/payment/status/[id]/route.ts`, `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/webhooks/razorpay/route.ts`, and `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/admin/(dashboard)/orders/[id]/page.tsx`; extend `/Users/cars24/Desktop/Personal-Projects/NitiVidya/tests/e2e/commerce-regressions.spec.ts` and the Nimbus sync tests.

1. Write failing tests for duplicate callbacks/webhooks/status recovery racing on one order: one confirmation transition and one outbox job, with no NimbusPost network call during any response. Test transaction failure cannot leave confirmed status without the job.
2. Centralize the existing confirmed database transition plus job insert in a Prisma transaction, with compare-and-set expected status and a unique per-order job. Keep order totals unchanged and payment failures independent of sync failures.
3. Harden the Razorpay webhook: require configured secret and valid signature; never confirm on `payment.authorized`; match the stored provider binding, amount and currency; confirm `order.paid` only after obtaining verified captured payment evidence. A retriable internal processing failure must return a failure status so the provider retries. Do not log raw payloads/PII.
4. Route verify/status/webhook confirmation through the helper. Preserve existing captured-payment behavior, repeat-call responses, and once-only business notifications after the transaction wins.
5. Replace direct admin “Confirm” with verified manual prepaid evidence, or explicit approval for an existing genuine COD arrangement if used. Ordinary status transitions still use actual schema values. Require signed admin authorization from Task 4. Do not export `PENDING_WHATSAPP` merely because the customer opened/sent a chat message.
6. Test feature-disabled behavior creates no export work; later cancellation never causes payment to fail; the reconciliation cutoff cannot include the four historical records.
7. Run `npx playwright test tests/e2e/commerce-regressions.spec.ts tests/e2e/nimbuspost-order-sync.spec.ts --project=desktop --grep 'confirmation|webhook|eligibility|history'`, then existing commerce tests. Expect only mocked external calls.

## Task 4: Protect owner actions and the worker

**Files:** Create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/lib/admin-session.ts`; modify `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/admin/login/route.ts`, `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/admin/(dashboard)/orders/page.tsx`, and `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/admin/(dashboard)/orders/[id]/page.tsx`; create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/admin/orders/[id]/nimbuspost/route.ts` and `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/cron/nimbuspost-order-sync/route.ts`.

1. Write failing tests rejecting missing cookies, forged current plain admin-ID cookies, expired/modified signed sessions, cross-origin owner mutations, missing cron bearer tokens, and disabled/preview environments. Unauthorized requests must make zero order/shipping-data reads, database mutations, and provider calls.
2. Use existing Node crypto for a signed, expiring admin session containing the admin ID; validate signature/expiry and current admin existence server-side. Update login to issue the signed cookie. Existing admin cookies must reauthenticate; middleware presence checks alone remain insufficient for mutations.
3. Enforce the session validator before Prisma order reads in the existing admin orders list/detail Server Component loaders and any new shipping-status GET handler, as well as in the order status/approval Server Action and new retry/reconciliation POST endpoint. Validate allowed state transitions, request body, and same-origin owner requests. Do not rely on `/admin` page visibility or cookie presence to protect order data or `/api/admin`. Keep this change limited to the shipping/orders surfaces and session issuance; do not rewrite unrelated admin authorization.
4. Cron uses only `Authorization: Bearer <CRON_SECRET>` with constant-time comparison, fails closed when unset, and permits production-enabled execution only. It must return safe counts and error codes, never customer data or credentials.
5. Run `npx playwright test tests/e2e/nimbuspost-order-sync.spec.ts --project=desktop --grep 'auth|disabled|origin'`; confirm no real login/session or provider request is used.

## Task 5: Implement the bounded scheduled worker and uncertainty handling

**Files:** Create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/lib/nimbuspost-order-sync.ts`; complete `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/lib/nimbuspost.ts` and `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/cron/nimbuspost-order-sync/route.ts`; create `/Users/cars24/Desktop/Personal-Projects/NitiVidya/vercel.json` only after schedule limits are confirmed; extend Nimbus sync tests.

1. Write failing tests for two workers racing, lease expiry before/after dispatch, remote acceptance followed by database-save failure, bounded job reconciliation, verified success, safe rate-limit retry, invalid credentials, validation error, malformed response, timeout after successful remote creation, and manual-review resolution.
2. Claim a small bounded batch using PostgreSQL transaction/compare-and-set state and lease tokens. Do not depend on an in-memory lock or a database advisory lock surviving PgBouncer sessions. No transaction spans a provider request.
3. Implement request timeout, confirmed response parsing, backoff, and the exact-reference reconciliation strategy established in Task 1. With no supported safe lookup/idempotency, timeout and unknown response go directly to `REVIEW` and cannot be automatically re-created.
4. Every completion/retry write checks the same lease token; stale workers cannot replace a newer result. Expired dispatches enter reconciliation/review before another create attempt. A test must prove both timeout-after-create and overlapping workers produce no automatic second create call.
5. Reconciler scans only new eligible orders missing a job and respects the feature flag/cutoff. Recheck order eligibility before dispatch; never export cancelled or already shipped orders. A previously dispatched uncertain order remains visible for review.
6. Propose a five-minute worker interval, subject to the owner's acceptable delay and available Vercel plan. A once-daily Hobby schedule does not meet that proposal; an approved eligible plan or authenticated external scheduler is required for it. Configure the owner-approved cron interval, function duration, batch limit, and lease window together. Vercel scheduling is UTC; display operational times in IST. If the account cannot meet the interval, leave the schedule disabled and document the explicit alternative decision. [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [schedule accuracy and operation](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
7. Run `npx playwright test tests/e2e/nimbuspost-order-sync.spec.ts --project=desktop --grep 'worker|lease|timeout|retry|reconcile'`; expect all tests to pass using fake time and mocked transport/Prisma.

## Task 6: Give the owner status, retry, and reconciliation controls

**Files:** Modify `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/admin/(dashboard)/orders/page.tsx` and `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/admin/(dashboard)/orders/[id]/page.tsx`; complete `/Users/cars24/Desktop/Personal-Projects/NitiVidya/src/app/api/admin/orders/[id]/nimbuspost/route.ts`; extend Nimbus sync tests.

1. Write failing browser tests for queued, synced, delayed, and review states; authorize/mutate through mocked routes/actions only, and block all other non-GET requests plus mutation-capable payment-status GETs.
2. Display sync status, NimbusPost order reference, last attempt time, and a short actionable error. State explicitly that the order exists in NimbusPost but **the owner still books the shipment**. Only use a verified provider dashboard link format.
3. Expose safe “retry” for undispatched/proven-not-created work and separate “resolve uncertain result” actions for existing provider ID or confirmed absence. Repeated clicks and a worker race must not make duplicate jobs or remote requests. For synced orders, disable create/retry; for cancelled synced orders, show a manual follow-up notice.
4. Present manual prepaid confirmation with evidence fields and clear totals. Show existing-arrangement COD approval only when the owner actually uses it and the account contract can express the collectible amount; do not advertise a new COD offering. Do not create labels, show automatic pickup controls, or introduce a checkout shipping-automation step.
5. Run `npx playwright test tests/e2e/nimbuspost-order-sync.spec.ts --project=desktop --project=mobile --grep 'admin UI'`; validate visible status and controls in both layouts.

## Task 7: Verify and stage production launch

**Files:** No further runtime files unless a verified failure requires a fix. Update this plan's execution record during implementation; any live deployment requires owner confirmation under the repository's deploy rule.

1. Run focused checks from the repository root:

   ```bash
   npx playwright test tests/e2e/nimbuspost-order-sync.spec.ts tests/e2e/commerce-regressions.spec.ts --project=desktop
   npx playwright test tests/e2e/checkout.spec.ts tests/e2e/cart.spec.ts --project=desktop --project=mobile
   npx tsc --noEmit
   npx eslint src/lib/nimbuspost.ts src/lib/nimbuspost-order-sync.ts src/lib/order-confirmation.ts src/lib/admin-session.ts src/app/api/cron/nimbuspost-order-sync src/app/api/admin/orders src/app/api/admin/login/route.ts src/app/api/payment src/app/api/webhooks/razorpay/route.ts 'src/app/admin/(dashboard)/orders' tests/e2e/nimbuspost-order-sync.spec.ts tests/e2e/commerce-regressions.spec.ts
   npm run check:emoji
   npm run build
   ```

   Expected: targeted tests/type checks/lint/build pass; any pre-existing unrelated failure is identified separately. Browser tests run only on a local server with writes mocked. Never run mutation-capable tests against the live storefront or call the live cron endpoint as a test.
2. Inspect the diff: no credential values, unrelated migrations/catalog changes, shipping-booking calls, unprotected mutation endpoint, or historical auto-import. Review every confirmation path and negative case below.
3. Deploy additive schema and disabled code using approved migration/production deployment processes. Keep preview creation disabled even if previews share the production database. Set separate production credentials and confirm owner-selected scheduling.
4. With explicit approval for the single provider write, use a dedicated NimbusPost sandbox/test account if available, or an agreed controlled order in the real account. Confirm it appears as **unshipped**, provider amount matches its documented meaning, website receipt retains the full shipping-inclusive total, and payment type matches, and no courier/AWB/label/pickup/wallet debit occurs. Do not book a shipment during validation. If create-only itself has a documented charge, disclose and resolve that before the request.
5. Set a fixed new-order cutoff and enable for a small agreed launch cohort. Do not change the cutoff backwards when toggling the feature. Observe the first genuine eligible order through queue, worker, and NimbusPost dashboard; match one local order to one provider reference.
6. Check safe admin health/counts after two expected worker cycles. Report queue age, success/review counts, auth/configuration issues, and whether the real allowed cadence meets the agreed delay. Existing email/WhatsApp failure signals may be reused without adding a notification vendor; suppress repeated alerts for unchanged errors.
7. Roll back by disabling the feature/worker explicitly (a Vercel deployment rollback alone does not remove active cron schedules), preserving existing provider IDs and ambiguous attempts for manual handling. Payment remains operational. Do not delete remote orders, reset the database, or re-create uncertain jobs during rollback. [Vercel cron rollback behavior](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## Acceptance checklist

- A new verified prepaid website order creates one unshipped NimbusPost order on the next permitted worker cycle, assuming valid configuration/provider availability. The target delay is the agreed schedule interval plus bounded worker execution, not an unverified fixed number of minutes.
- An explicitly approved COD order maps to COD with the correct collectible total. Unpaid WhatsApp requests never sync. Verified manual prepaid approval requires recorded evidence and maps to prepaid.
- Repeated callback/webhook/status/admin confirmation attempts create one durable job. Simultaneous workers cannot intentionally dispatch the same job twice. Unknown remote outcomes are reconciled or reviewed, never blindly retried; exactly-once remote semantics remain contingent on provider guarantees.
- Provider downtime, invalid data, and credential errors change sync state, **never** payment status to failed. Checkout does not wait for NimbusPost.
- The website keeps ₹174 + ₹49 = ₹223, and the five-book set is ₹500 with free shipping. V2 receives ₹174 in item sale values, ₹49 in separate shipping charges, and ₹223 in declared `order_amount`. Approved COD collectible mapping preserves ₹223; no synthetic shipping SKU or duplicate discount exists.
- Cancelled, shipped, fulfilled, pending, failed, and historical orders are excluded from new dispatch. Existing four orders require explicit backfill approval.
- No courier selection, shipment booking, AWB/label generation, pickup request, wallet spend, or remote cancellation call exists in Phase 1.
- Admin actions use signed validated sessions; cron uses a runtime secret; previews and disabled environments cannot create provider orders. Logs expose neither customer PII nor secrets.
- A process crash after remote creation preserves an uncertain result; the next worker does not automatically create again. Owner recovery works without duplicate jobs.
- The owner can see and safely resolve failed/uncertain syncs, and knows that shipment booking remains manual in NimbusPost.

## Effort and open decisions

Rough engineering estimate: **3–5 focused working days** after account/API contract and schedule access are confirmed, including isolated tests, migration review, owner controls, and staged validation. This is a planning estimate, not a delivery promise; undocumented shipping-total or duplicate-create behavior, account access, migration-history issues, and scheduler restrictions may extend it.

Remaining inputs are secure account-key setup, reviewed implementation of the verified v2 mapping/positive lookup, the owner's scheduler interval decision, and approval for the single controlled create-only validation. Warehouse/package values can be omitted for draft creation but must be verified by the owner before booking. Historical backfill and automatic shipment booking remain separate decisions.

## Execution record — 2026-10-14 IST

Implementation is staged locally in the isolated `codex/nimbuspost-order-sync` worktree. The framework, account-linked v2 adapter, and final local QA are complete and approved through specification and code-quality review. Live NimbusPost order creation and production acceptance remain unfinished.

- **Task 1:** The actual account's API Keys page links to the published v2 reference recorded above. JSON encoding, two-header authentication, create-only endpoint, response ID, totals, names, and positive lookup are documented. The selected adapter is implemented, tested, and approved through specification and code-quality review. The owner-approved dedicated key was created and `NIMBUSPOST_API_KEY_ID`/`NIMBUSPOST_API_SECRET` securely saved to Vercel `web-app` Production only. Remaining runtime configuration and controlled provider validation are pending.
- **Tasks 2, 4, and 3:** Durable state, signed authorization, and atomic evidence-based confirmation have passed specification and code-quality review. The exact feature migration was applied only to a disposable local database.
- **Task 5:** Worker framework and its v2 adapter/exact-reference lookup passed specification and code-quality review and final QA. The factory uses the settled key-ID/secret environment variables and stays unavailable without valid credentials. Empty lookup still cannot establish remote absence. No live provider call or activation has occurred.
- **Task 6:** Owner status and recovery controls passed specification and code-quality review, including explicit IST display and durable nullable `lastAttemptAt`. That field is included in the original, still undeployed feature migration; no additional `Order` column or unrelated `BlogPost` schema change was introduced.
- **Task 7:** Local QA and final integrated code-quality review passed. Production deployment, controlled provider validation, and activation remain pending; the launch acceptance checklist above is not yet satisfied.

Latest account state on 2026-10-14: earlier **No API keys** and unset-credential statements describe the pre-approval discovery stage and are superseded here. The owner explicitly approved creating `NitiVidya Website Order Sync` with Admin (full read/write), customer-data response access off, no IP restriction, and no expiry, plus storing only its ID/secret in Vercel `web-app` Production. Creation completed: the native page shows an active Admin key and All IPs; customer-data access was off and expiry empty in the confirmed form. Both credential rows were verified as **Secret**, Production only, with a Vercel success confirmation. The one-time secret modal was closed after storage. No secret values were printed or written locally/repository; transient buffers were cleared. This approval did not authorize deployment or shipment booking. Native owner-profile Vercel access works; the connected office profile returned 404, with no authentication change.

Final post-adapter verification: **111 checks passed** — 84 desktop NimbusPost/commerce checks including both explicitly guarded real local PostgreSQL checks, seven mobile admin-UI checks under UTC, and 20 desktop/mobile checkout/cart checks against the local production build. Browser writes and mutation-capable GETs were mocked. The Next.js 16.3.8 production build, TypeScript, targeted ESLint, emoji checks, and diff checks passed. A nonworking build-only OpenRouter placeholder satisfied initialization without any external call.

The local test server was stopped and the disposable database container removed after final QA. Order, sync-job, admin, and user fixture counts were zero before cleanup; database/browser reruns require recreating the isolated environment.

The required Next.js and `eslint-config-next` 16.3.8 manifest/lockfile patch passed specification and code-quality review and was limited to the required dependency subtree. The remaining dependency audit reports 25 findings: one low, seven moderate, 16 high, and one critical. The critical `fast-xml-parser` finding is in the existing pinned AWS subtree, which was left unchanged; no Next.js finding remains.

Read-only production metadata checks confirmed the existing three migrations are applied and match repository history. The known Supabase shared-pooler session connection on port 5432 works; `Order` exists and the NimbusPost table does not. The current migration role's applicable new-table defaults grant neither `anon` nor `authenticated` table access. No production schema change or customer-data read was performed.

The current Vercel CLI session cannot access production team `nitividya-books-projects`, but the native owner-profile dashboard verified **Hobby** and current production commit `94f3436`. [Current Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) allow Hobby jobs once per day with up to 59 minutes of timing variation; the proposed five-minute cron would fail deployment. The owner chose the QStash five-minute option below for **preparation only**. Account setup/terms, dedicated cron-secret sharing, and schedule activation remain unapproved and unperformed. No schedule, purchase, or `vercel.json` change has been made. NimbusPost credential values are saved in Production configuration, but the old deployed code has not been redeployed to use them. `ADMIN_SESSION_SECRET` of at least 32 characters, dedicated `CRON_SECRET`, `NIMBUSPOST_ENABLED=false`, and a fixed future UTC `NIMBUSPOST_SYNC_FROM` remain unconfigured and unapproved.

No NimbusPost API request or provider order/shipment write, production schema migration, redeployment, schedule, activation, commit, or push has occurred during this implementation turn. Launch still requires approved remaining runtime configuration, the additive schema before the disabled admin-code deployment with its signing secret, QStash account/secret-sharing/activation approval, explicit deployment approval, and controlled live create-only acceptance. The full goal and launch acceptance checklist are not complete.

### Owner-selected preparation option: Upstash QStash external scheduler

The owner chose this option for **preparation only**; account setup, terms, cron-secret sharing, and activation are not approved or configured. As of 2026-10-14, [QStash pricing](https://upstash.com/pricing/qstash) provides 1,000 free delivery attempts per day, ten active schedules, and a 15-minute maximum HTTP duration; retries count as attempts. A five-minute schedule makes 288 requests per day. Existing account usage/quota is unverified, and the free plan has no SLA.

Proposed [schedule configuration](https://upstash.com/docs/qstash/api-reference/schedules/create-a-schedule):

| Setting | Proposed value |
|---|---|
| Schedule ID | `nitividya-nimbuspost-orders`; check for collisions and never replace an existing schedule |
| Destination | `https://www.nitividyabooks.com/api/cron/nimbuspost-order-sync` |
| `Upstash-Cron` | `*/5 * * * *` — UTC |
| `Upstash-Method` | `GET`; no request body |
| `Upstash-Timeout` | `70s` — accommodates the existing 50-second worker and 60-second Vercel function |
| `Upstash-Retries` | `0`; the durable outbox handles safe recovery on later cycles |
| `Upstash-Forward-Authorization` | `Bearer <dedicated CRON_SECRET>` |
| `Upstash-Redact-Fields` | `headers` |

The public homepage returned HTTP 200 without redirects, verifying the proposed host. The new endpoint is not deployed or called; verify its redirect/auth behavior after the approved disabled deployment and before schedule submission. Use the actual Upstash console's account/region/API destination, never an assumed legacy global host.

Setup requires explicit owner approval for Upstash account setup/terms/free-plan use and sharing a new endpoint-only `CRON_SECRET`. Deploy the additive schema, disabled code, and secure runtime configuration first. QStash receives only the endpoint and cron secret, never NimbusPost credentials or customer payloads. No subscription, purchase, or activation is authorized by this proposal.

Rollback: disable the application's feature first, then [pause the schedule](https://upstash.com/docs/qstash/api-reference/schedules/pause-a-schedule) to stop future triggers and review any in-flight delivery. Cron-job.org's default 30-second timeout does not fit this worker; Google Cloud Scheduler would require separate billing/project approval. No extra infrastructure or runtime dependency is introduced here.
