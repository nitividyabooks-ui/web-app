# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Memory Rule

**Always save important findings to memory.** Whenever you discover a non-obvious technical fact, a bug root cause, a working pattern, or a constraint about this codebase or its infrastructure, write it to `.claude/memory/` and add a pointer in `.claude/memory/MEMORY.md`. This includes things like: API quirks, Vercel deployment constraints, third-party integration gotchas, env var formatting requirements, and any fix that took significant debugging to reach. Future conversations should not have to rediscover the same things.

---

## Read These First

**For agent structure and company context**: See [`AGENTS.md`](./AGENTS.md) — covers all 11 agents, memory system, API endpoints, inter-agent data flow, and go-to-market phase.

**For marketing strategy**: See `marketing/` folder — brand positioning, GTM phases, Amazon strategy, Instagram, Meta ads.

---

## Company

**NitiVidya Books** — Indian cultural children's book brand. The **Miko series** (5 books, ages 0–5) teaches Indian festivals, values, and bilingual Hindi+English learning. Sold on the NitiVidya website and Amazon India.

**Owner**: Nitin Sharma. Solo founder. Runs the business via Claude on phone.

**Current phase**: Phase 1 → Phase 2 (building Amazon reviews and audience).

---

## Agent System

NitiVidya runs 11 Claude agents that manage daily operations autonomously. The **CEO agent** is the owner's sole interface — it orchestrates all specialists and compiles a morning brief. See `AGENTS.md` for the full roster.

Agent files live in `.claude/agents/`. Memory files live in `.claude/memory/`. Memory is committed to git by the CEO agent after each morning brief.

---

## Recent Changes (keep until superseded)

- **2026-06-12**: Full consumer-site redesign shipped (Warm Editorial Premium design system, GA4 standard ecommerce events via `src/lib/analytics.ts`, 8 SEO collection pages at `/collections/[slug]`, `/free-printables` lead magnet, no emojis in UI — enforced by `npm run check:emoji`, chained into lint). Master plan: `docs/plans/2026-06-11-website-redesign-master-plan.md`. GA4 dashboard guide: `docs/ga4-funnel-setup.md`. Keyword map: `docs/seo-keyword-map.md`. Do NOT add a root `src/app/loading.tsx` (causes soft-404s — see `.claude/memory/root-loading-tsx-soft-404.md`).
- **2026-05-09**: GA4 browser tracking fixed. Removed `NEXT_PUBLIC_GTM_ID=GTM-XXXXXX` (placeholder) from Vercel. GA4 Measurement ID `G-1E32RCMV28` now loads directly. Data accumulating from this date. Server-side GA4 API (property `516454398`) was always configured.

---

## Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # prisma generate + next build
npm run lint         # Run ESLint
npm run products:export  # Export product data via scripts/export-products.js
npm run products:import  # Import product data via scripts/import-products.js
node prisma/seed.js  # Seed admin user and initial products
```

No test framework is configured.

## Architecture

**NitiVidya** is a Next.js 16 e-commerce platform for children's books with three distinct domains:
1. **B2C Storefront** — product catalog, cart, checkout, Razorpay/PhonePe payments
2. **Admin Dashboard** — order management, customer analytics, CRM
3. **Amazon Seller Tools** — AI-powered listing optimization, competitor tracking, PPC campaign management

### Key Structural Decisions

**App Router with Route Groups**: Admin routes are grouped under `src/app/admin/(dashboard)/` with a shared layout and middleware-enforced session auth. The `admin_session` cookie (httpOnly, 60-day) contains the admin user ID — no JWT signing.

**AI Analysis Pipeline** (`src/app/api/admin/amazon/analysis/route.ts`, maxDuration: 120s):
1. Accepts multipart form data (images + book/competitor data)
2. Uploads images to Supabase Storage (`amazon-analysis/{id}/images/`)
3. Fetches source listing + competitor data from DB
4. Calls OpenRouter (`openai/gpt-4o-mini`) using the OpenAI SDK with a custom `baseURL`
5. Saves markdown output to Supabase Storage, creates `ListingAnalysis` DB record

**Prompts** (`src/lib/prompts.ts`, 622 LOC): All AI prompts live here. Template literals use escaped backticks (`\``). Separate flows for "improve" (existing listing) vs "create" (new listing from competitor intelligence).

**Supabase Storage**: Accessed via direct HTTP REST calls (no Supabase JS SDK). Helper functions in `src/lib/storage.ts`.

**OpenRouter client** (`src/lib/openrouter.ts`): Uses the `openai` npm package pointed at `https://openrouter.ai/api/v1`. The `@anthropic-ai/sdk` is installed but the active AI path goes through OpenRouter.

### Database

- **ORM**: Prisma 5 → PostgreSQL (Supabase)
- **Connection**: Port 6543 (PgBouncer transaction-mode) with `?pgbouncer=true&connection_limit=1` — required for Next.js serverless
- **Migrations**: `prisma migrate` works for schema changes; `prisma db push` is blocked by transaction-mode pooler (use Supabase SQL Editor instead)
- **Singleton**: `src/lib/prisma.ts` uses `globalForPrisma` pattern to prevent connection pool exhaustion in dev

**Key models**: `Product`, `Order`, `OrderItem`, `User`, `AdminUser`, `ListingAnalysis`, `AmazonListing`, `AmazonCampaign`, `CompetitorAsin`, `Lead`, `CampaignHit`, `EmailSubscriber`, `BlogPost`

### State Management

- **React Context** for global state: `UserContext` (identity + campaign tracking) and `CartContext` (localStorage-persisted cart)
- No Redux/Zustand
- Zod validates all API request payloads

### Path Alias

`@/*` → `src/*` (configured in `tsconfig.json`)

## Environment Variables

```
# Database (transaction-mode pooler)
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_STORAGE_BUCKET_NAME=nitividyabooks
SUPABASE_SERVICE_ROLE_KEY=

# AI
OPENROUTER_API_KEY=         # Primary AI path (gpt-4o-mini via OpenRouter)
ANTHROPIC_API_KEY=          # Secondary/fallback

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Amazon SP-API
AMAZON_SP_REFRESH_TOKEN=
AMAZON_SP_CLIENT_ID=
AMAZON_SP_CLIENT_SECRET=
AMAZON_AWS_ACCESS_KEY=
AMAZON_AWS_SECRET_KEY=
AMAZON_ROLE_ARN=
AMAZON_MARKETPLACE_ID=A21TJRUUN4KGV

# Amazon Ads API
AMAZON_ADS_CLIENT_ID=
AMAZON_ADS_CLIENT_SECRET=
AMAZON_ADS_REFRESH_TOKEN=

# Other
NEXT_PUBLIC_BASE_URL=
RESEND_API_KEY=
BUSINESS_EMAIL=
ALERT_EMAIL=
```

`.env.local` takes precedence over `.env`.

## Prompt Editing

When editing `src/lib/prompts.ts`, all backticks inside template literals must be escaped as `` \` ``. Use a script to escape if needed:

```bash
python3 -c "
content = open('src/lib/prompts.ts').read()
# escape inner backticks manually or via regex
"
```
