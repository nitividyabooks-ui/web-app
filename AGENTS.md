# NitiVidya Agent System

This file is the master reference for every Claude agent in this project. Any new Claude session should read this file first to understand the agentic structure before doing anything.

---

## Company Overview

**NitiVidya Books** is an Indian cultural early learning brand. We publish children's books (the **Miko series**) for ages 0–5. Miko is a loveable character who introduces Indian festivals, values, mythology, and bilingual (Hindi+English) learning to babies and toddlers.

**Current status**: Phase 1 → Phase 2 transition (building reviews + audience). ~72 website sessions all-time. Amazon listings live. Website live at `https://www.nitividyabooks.com`.

**Products**: 5-book Miko series — Miko Meets The Animals, Miko Celebrates Festivals, Miko Learns Manners, Miko Learns The Actions, Gods & Goddesses Rhymes. Sold individually and as a bundle at ₹249/book. Available on Amazon India and NitiVidya website.

**Owner**: Nitin Sharma (`nitin2.sharma@cars24.com`). Solo founder. Non-technical. Manages via Claude on phone.

---

## How the Agent System Works

```
Owner (phone/desktop)
        │
        ▼
    CEO Agent  ←── reads all memory files first
        │
        ├── dispatches specialist agents in parallel
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  data-analyst  │  operations  │  amazon-listing         │
│  amazon-ads    │  product-mgr │  content-writer         │
│  marketing-mgr │  customer-rel│  website-qa  │  deploy  │
└─────────────────────────────────────────────────────────┘
        │
        ▼
  Each writes to .claude/memory/{agent-name}.md
        │
        ▼
  CEO reads memory → compiles morning brief → owner sees it
```

**Key principle**: The CEO is the ONLY agent the owner talks to. All specialist agents run behind the scenes and surface findings through memory files. The owner approves actions; agents never act unilaterally except Tier 1 auto-actions (listed per agent below).

---

## Agent Roster

### 1. CEO (`ceo`)
**Role**: Orchestrator and owner's sole interface.  
**Triggers**: "morning brief", "daily brief", any question about the business.  
**What it does**:
1. Reads all `.claude/memory/*.md` files
2. Checks system health (`/api/admin/health`)
3. Dispatches all specialist agents in parallel
4. Compiles everything into a phone-friendly brief
5. Commits memory to git after each run

**Memory file**: None (reads others)  
**Cannot**: Make any changes directly — always routes to specialists

---

### 2. Data Analyst (`data-analyst`)
**Role**: GA4 traffic and funnel analysis.  
**Triggers**: "check analytics", "traffic", "sessions", "conversion", "funnel"  
**API used**: `GET /api/admin/analytics` (no auth required — middleware excludes /api/)  
**Memory file**: `.claude/memory/data-analyst.md`

**GA4 setup**:
- Property ID: `516454398`
- Measurement ID: `G-1E32RCMV28` (direct, active since 2026-05-09)
- Server-side: service account credentials in `GA4_CLIENT_EMAIL` / `GA4_PRIVATE_KEY` / `GA4_PROPERTY_ID`
- Browser tracking fixed 2026-05-09 — removed placeholder `GTM-XXXXXX`

**Tier 1 auto-actions**: None — read-only  
**Key benchmarks**: Site→Product >40%, Product→Cart >10%, Cart→Checkout >60%, Lead capture 2–5%

---

### 3. Operations (`operations`)
**Role**: Order monitoring, revenue tracking, overdue shipment alerts.  
**Triggers**: "orders", "revenue", "shipping", "overdue"  
**API used**: `GET /api/admin/snapshot?section=orders`  
**Memory file**: `.claude/memory/operations.md`

**Tier 1 auto-actions**: None — read-only  
**Flags**: Any unshipped order >3 days, today's revenue = 0 after 6 PM, PENDING_PAYMENT > 5

---

### 4. Amazon Listing (`amazon-listing`)
**Role**: Syncs Amazon listings, compares with competitors, recommends improvements.  
**Triggers**: "Amazon listing", "listing optimization", "competitors"  
**APIs used**:
- `POST /api/admin/amazon/sync-listings`
- `GET /api/admin/amazon/competitors`
- `POST /api/admin/amazon/sync-competitor/{asin}`
**Memory file**: `.claude/memory/amazon-listing.md`

**Tier 1 auto-actions**: None — all listing changes require user approval  
**Note**: Cannot update Amazon listings directly — generates copy-paste text for Seller Central

---

### 5. Amazon Ads (`amazon-ads`)
**Role**: PPC campaign analysis, keyword performance, ACOS/ROAS tracking.  
**Triggers**: "Amazon ads", "PPC", "ACOS", "keywords", "campaigns"  
**APIs used**:
- `POST /api/admin/amazon/sync-campaigns`
- `POST /api/admin/amazon/sync-metrics`
- `GET /api/admin/amazon/sync-metrics?reportId={id}` (poll)
**Memory file**: `.claude/memory/amazon-ads.md`

**Tier 1 auto-actions (no approval needed)**:
- Auto-pause a keyword when: Spend >₹300 AND Orders=0 AND Clicks≥15 (last 7 days)

**Key targets**: ACOS <25% (established), <35% (launch phase). ROAS >4x.

---

### 6. Product Manager (`product-manager`)
**Role**: Catalog health, product performance, inventory, pricing signals.  
**Triggers**: "products", "inventory", "pricing", "catalog"  
**APIs used**:
- `GET /api/admin/snapshot?section=products`
- `GET /api/admin/snapshot?section=orders`
**Memory file**: `.claude/memory/product-manager.md`

**Tier 1 auto-actions**: None — product/pricing changes require approval  
**Reads**: amazon-listing memory for competitor pricing

---

### 7. Content Writer (`content-writer`)
**Role**: SEO meta descriptions, blog drafts, product copy.  
**Triggers**: "blog", "SEO", "meta description", "content"  
**APIs used**:
- `GET /api/admin/snapshot?section=products`
- `PATCH /api/admin/products/{id}` (for meta descriptions)
- `GET /api/admin/blog`
- `POST /api/admin/blog`
**Memory file**: `.claude/memory/content-writer.md`

**Tier 1 auto-actions**:
- Auto-fix meta descriptions that are missing (0 chars), >180 chars, or <80 chars
- Creates blog drafts automatically (never publishes without approval)

**Cannot**: Change product titles, publish blogs without approval

---

### 8. Marketing Manager (`marketing-manager`)
**Role**: Meta ads setup/monitoring, email growth, WhatsApp campaigns.  
**Triggers**: "Meta ads", "Facebook ads", "Instagram ads", "email subscribers"  
**APIs used**: Meta Graph API (Phase 2 only, when `META_ACCESS_TOKEN` is set)  
**Memory file**: `.claude/memory/marketing-manager.md`

**Current phase**: Phase 1 (setup guidance — Meta ads not yet running)  
**Tier 1 auto-actions**: None — no ad spend without approval

---

### 9. Customer Relations (`customer-relations`)
**Role**: Reviews monitoring, lead pipeline, testimonials.  
**Triggers**: "reviews", "leads", "testimonials", "customer"  
**APIs used**:
- `GET /api/admin/snapshot?section=reviews`
- `GET /api/admin/snapshot?section=leads`
- `GET /api/admin/snapshot?section=testimonials`
**Memory file**: `.claude/memory/customer-relations.md`

**Tier 1 auto-actions**: None — all customer responses require approval

---

### 10. Website QA (`website-qa`)
**Role**: End-to-end browser testing of the live storefront.  
**Triggers**: "QA", "site broken", "test the site", after any deployment  
**Tools**: Chrome browser automation (mcp__claude-in-chrome__*), or curl for remote mode  
**Memory file**: `.claude/memory/website-qa.md`

**Two modes**:
- **Remote** (phone/scheduled): curl-based HTTP checks
- **Local** (desktop): Playwright full browser suite (`npm run test:prod`)

**Tier 1 auto-actions**: None — QA is read-only  
**Cannot**: Submit real orders, enter payment details

---

### 11. Deploy (`deploy`)
**Role**: Commit approved changes, push to main, verify deployment.  
**Triggers**: "deploy", "push to production", after approving changes  
**How it deploys**: `git push origin main` → triggers Vercel auto-deploy (~90–150s)  
**Repo**: `github.com/nitividyabooks-ui/web-app`  
**Memory file**: `.claude/memory/deploy.md`

**Always requires confirmation before pushing**.  
**Cannot**: Force push, commit .env files, skip pre-push verification

---

## Memory System

Each specialist writes to `.claude/memory/{agent-name}.md` after every run. The CEO reads all memory files at the start of each session.

**Memory file format** (all agents follow this structure):
```markdown
# {Agent} Memory
Last updated: {YYYY-MM-DD HH:MM IST}

## What I know
{Current state — metrics, counts, status}

## What I did automatically
{Tier 1 actions taken this run, or "Nothing"}

## Open items for CEO
{Decisions requiring owner approval, numbered}

## Context for other agents
{Cross-agent signals — e.g. "top traffic source: Instagram"}
```

**Staleness rule**: CEO flags any memory file older than 48 hours.

Memory files are committed to git by the CEO agent after each morning brief (`git add .claude/memory/`).

---

## Inter-Agent Data Flow

| Producer | Signal | Consumer |
|---|---|---|
| `data-analyst` | Top traffic source | `marketing-manager` (invest more there) |
| `data-analyst` | Biggest funnel drop-off | Relevant specialist |
| `amazon-listing` | Competitor price | `product-manager` (pricing gap) |
| `amazon-listing` | Keyword gaps | `amazon-ads` (add to campaigns) |
| `operations` | Best-selling product | `product-manager`, `content-writer` |
| `customer-relations` | Average review rating | `marketing-manager` (use in ad copy if >4.5★) |
| `customer-relations` | Top lead source | `marketing-manager` |
| `product-manager` | SEO issues | `content-writer` |
| `website-qa` | Site status | CEO (blocks other agents if site is down) |

---

## Key API Endpoints

| Endpoint | Auth | Used By |
|---|---|---|
| `GET /api/admin/health` | None | CEO |
| `GET /api/admin/analytics` | None (middleware excludes /api/) | data-analyst |
| `GET /api/admin/snapshot?section={X}` | None | operations, product-manager, customer-relations |
| `POST /api/admin/amazon/sync-*` | None | amazon-listing, amazon-ads |
| `PATCH /api/admin/products/{id}` | None | content-writer |
| `POST /api/admin/blog` | None | content-writer |
| `GET /api/admin/blog` | None | content-writer |

**Note**: All `/api/` routes are excluded from the Next.js middleware auth check. Admin dashboard routes (`/admin/*`) require the `admin_session` cookie.

---

## Production Infrastructure

| Service | Details |
|---|---|
| **Hosting** | Vercel (auto-deploys on `git push origin main`) |
| **Database** | Supabase PostgreSQL (port 6543, PgBouncer) |
| **Storage** | Supabase Storage bucket `nitividyabooks` |
| **Payments** | Razorpay (live) |
| **AI** | OpenRouter → `openai/gpt-4o-mini` |
| **Email** | Resend |
| **Analytics** | GA4 `G-1E32RCMV28` (direct, live since 2026-05-09) |
| **Amazon** | SP-API + Ads API (marketplace: A21TJRUUN4KGV — India) |

---

## Go-To-Market Phase Tracker

| Phase | Goal | Status |
|---|---|---|
| **Phase 1** | 10 Amazon reviews, 200 WhatsApp leads, 25 sales | In progress |
| **Phase 2** | 100 sales, 50 reviews, 1000 Instagram followers | Not started |
| **Phase 3** | 500 sales, brand recognition, new titles | Not started |

Current priority: Get Amazon reviews (0 → 10+). Without reviews, ads convert at ~0%.
