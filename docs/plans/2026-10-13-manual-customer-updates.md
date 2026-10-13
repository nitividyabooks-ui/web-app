# Manual Customer Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the owner review an order update and open a WhatsApp draft or send a customer email, with accurate history.

**Architecture:** A client panel uses a server endpoint protected by a signed admin communication session. Prisma stores each reviewed attempt separately from order metadata; Resend handles plain-text email with idempotency. Checkout supplies optional customer email.

**Tech Stack:** Existing Next.js, React, Prisma/PostgreSQL, Resend, Node crypto and Playwright; no new dependencies.

### Task 1: Message and session contracts

Files: src/lib/customer-communication.ts, src/lib/admin-communication-session.ts, tests/e2e/customer-communication.spec.ts.

1. Write failing tests for Indian phone normalization, editable templates, signature tampering/expiry and missing configuration.
2. Run `npx playwright test tests/e2e/customer-communication.spec.ts --project=desktop` and verify missing-feature failures.
3. Implement shared message types/templates and HMAC-signed 24-hour admin session helpers.
4. Re-run the tests and check expected behavior.

### Task 2: Protected sends and durable history

Files: prisma/schema.prisma, prisma/migrations/20261013000000_order_communications/migration.sql, src/app/api/admin/login/route.ts, src/app/api/admin/orders/[id]/communications/route.ts, tests/e2e/customer-communication.spec.ts.

1. Write route tests for auth/CSRF, saved recipient enforcement, optional email capture, WhatsApp draft logging, provider acceptance/failure and repeated request keys.
2. Observe failures before implementing the endpoint.
3. Add OrderCommunication with unique requestKey, channel, recipient, subject, message, status, adminId, providerMessageId and timestamps. Add migration source without running against production.
4. Issue a signed communication cookie at login when configured. Check it and the admin record on every request.
5. Reserve the reviewed payload before email delivery. Use the saved payload and same provider idempotency key on retry; reject changed payload and old pending retries.
6. Run mocked route tests. Generate only the isolated checkout's Prisma client.

### Task 3: Order panel and checkout email

Files: src/components/admin/CustomerCommunicationPanel.tsx, src/app/admin/(dashboard)/orders/[id]/page.tsx, src/components/checkout/DeliveryForm.tsx, src/app/checkout/page.tsx, tests/e2e/customer-communication-ui.spec.ts.

1. Write browser tests using a temporary local fixture, mocked API responses and blocked external sends.
2. Confirm the panel/email field tests fail before implementing.
3. Add templates, recipient and message editing, separate preview, explicit send/open buttons and accurate history. Keep uncertain retries on the same request key/payload.
4. Add optional checkout email validation and pass email through both order paths.
5. Run desktop/mobile UI checks, remove the temporary fixture, run targeted ESLint, TypeScript, regression tests and production build.
6. Review the diff; commit only this feature on the isolated branch. Report local completion and required production setup without pushing or sending real communications.

### Validation and deployment notes

Validated with 13 mocked communication/session tests, 23 existing commerce/cart regressions, 12 desktop/mobile UI checks, targeted ESLint, TypeScript, Prisma schema validation and generated SQL comparison. The UI suite creates and removes its own local admin fixture when COMMUNICATION_PREVIEW=1; run a separate local dev server with a dummy DATABASE_URL, then `COMMUNICATION_PREVIEW=1 BASE_URL=http://localhost:3011 npx playwright test tests/e2e/customer-communication-ui.spec.ts`.

Production compilation and type checking pass. The full build stops during existing product/blog static page data collection because the isolated checkout has no test database. Docker could not fetch PostgreSQL because its credential helper blocked; that attempt was cancelled and no container was started. No production database, customer provider or NimbusPost configuration was used or changed during validation.

Before deployment, apply the OrderCommunication migration using the project's database migration process, configure a random ADMIN_SESSION_SECRET of at least 32 characters, confirm RESEND_API_KEY and the verified ALERT_EMAIL sender, and sign in again. The new order-page query depends on the table, so apply the migration before serving the updated app. The signed communication cookie lasts 24 hours; the logout button now clears both dashboard and communication cookies.
