# EmailSubscriber table missing from production DB

**Found**: 2026-06-12, during website redesign Phase 6 (lead capture).

- `EmailSubscriber` exists in `prisma/schema.prisma` but **no migration was ever created for it** (migrations stop at `20260101061158_add_lead_table`). Every `/api/email-subscribers` POST returns 500 with Prisma `P2021` ("table does not exist"). This silently broke ALL email capture: exit-intent popup, blog capture, footer newsletter, old activity-kit form.
- **Fix**: run `docs/sql/2026-06-12-create-email-subscriber.sql` in the Supabase SQL Editor (owner approval required — direct prod DB access from Claude is permission-gated).
- `prisma migrate diff --from-url <pooler-url>` **hangs indefinitely** through the PgBouncer transaction-mode pooler (port 6543) — same class of failure as `prisma db push`. Use `prisma migrate diff --from-empty --to-schema-datamodel --script` (offline) to generate DDL instead.
- **Local dev runs against the production database** (`.env` DATABASE_URL is the Supabase pooler). Playwright test runs on 2026-06-12 created test Lead rows with phones `9876543210` and `9876543211` (sources: checkout, printables, welcome_modal) — owner should delete these from the Lead table.
