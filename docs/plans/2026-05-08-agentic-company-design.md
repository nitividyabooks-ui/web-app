# NitiVidya Agentic Company Design
Date: 2026-05-08

## Goal

Replace manual dashboard-checking with an AI-run company. One CEO agent is the single interface — you talk to it on your phone, it knows everything, and it handles the rest. Specialists run autonomously in their domains. You only make big decisions.

---

## Architecture: CEO-Led Hierarchy

```
You (phone)
    ↕
CEO Agent          ← your only interface, reads all memory, synthesizes, escalates
    ↓ dispatches
┌───────────────────────────────────────────────────────────┐
│  Data        Amazon      Amazon     Product    Content     │
│  Analyst     Listing     Ads        Manager    Writer      │
│              Expert      Manager                           │
├───────────────────────────────────────────────────────────┤
│  Marketing   Customer    Operations  Website   Deploy      │
│  Manager     Relations               QA        Agent       │
└───────────────────────────────────────────────────────────┘
         ↓ each writes to
    .claude/memory/{agent-name}.md
```

---

## Agent Roster

| Agent | File | Status | Domain |
|---|---|---|---|
| CEO | `ceo.md` | New | Orchestrator, your only interface |
| Data Analyst | `data-analyst.md` | New | GA4, funnels, traffic, conversions |
| Amazon Listing Expert | `amazon-listing.md` | Upgrade | Listing scores, keywords, competitors |
| Amazon Ads Manager | `amazon-ads.md` | Upgrade | ACOS/ROAS, keywords, budget pacing |
| Product Manager | `product-manager.md` | New | Catalog, pricing, inventory signals |
| Content Writer | `content-writer.md` | New (merge blog-writer + seo-optimizer) | Blog, SEO copy, meta descriptions |
| Marketing Manager | `marketing-manager.md` | Upgrade meta-ads | Meta ads, email, WhatsApp campaigns |
| Customer Relations | `customer-relations.md` | New | Reviews, testimonials, leads |
| Operations | `operations.md` | New | Orders, fulfillment, customer issues |
| Website QA | `website-qa.md` | Upgrade | Site health, post-deploy checks |
| Deploy Agent | `deploy.md` | Upgrade | Code changes, Vercel deploys |

**Retired:** `morning-brief.md`, `api-health.md`, `blog-writer.md`, `seo-optimizer.md` — absorbed into CEO and Content Writer.

---

## Memory System

Location: `.claude/memory/{agent-name}.md`

Every specialist writes this file after every run. CEO reads all 10 files before every response.

### Memory file format (every agent uses this):

```markdown
# {Agent Name} Memory
Last updated: YYYY-MM-DD HH:MM IST

## What I know
Current state of my domain — key numbers, trends, open issues.

## What I did automatically
Actions taken without approval in this run.

## Open items for CEO
Things that need owner attention or a bigger decision.

## Context for other agents
Facts that other agents should know about my domain.
```

### CEO memory usage:
- Reads all 10 memory files at the start of every interaction
- Flags any file with `Last updated` > 48 hours as stale
- Uses "Context for other agents" sections to cross-pollinate insights
- Never dispatches a specialist for something already known from memory

---

## Decision Authority

### Tier 1 — Auto-execute (no approval, logged in memory)

| Agent | Action | Threshold |
|---|---|---|
| Amazon Ads Manager | Pause keyword | 0 sales + >₹300 spent in 7 days |
| Content Writer | Fix meta description | Outside 50–160 char range |
| Content Writer | Fix missing image alt text | Any product page |
| Customer Relations | Mark lead cold | No activity in 90 days |
| Operations | Flag overdue order | Not shipped in 3 days |
| Website QA | Post-deploy check | After every Vercel deploy |

**Rule:** If reversible in under 5 minutes and costs under ₹500 → auto-execute.

### Tier 2 — Needs approval (CEO surfaces as numbered options)

| Decision | Owner |
|---|---|
| Pause/increase ad budget | Amazon Ads Manager |
| Competitor price match | Product Manager |
| Publish blog post | Content Writer |
| Launch new ad campaign | Marketing Manager |
| Price change on any product | Product Manager |
| Major listing rewrite (title, bullets) | Amazon Listing Expert |
| Any code deployment | Deploy Agent |
| Responding to a negative review | Customer Relations |

---

## Daily Interaction Model

### 8 AM IST — Automatic morning run

Schedule triggers CEO agent. All 10 specialists run in parallel and write to memory. CEO synthesizes into a morning brief:

```
━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 NITIVIDYA — {Day, Date}
━━━━━━━━━━━━━━━━━━━━━━━━━

✅ AUTO-DONE:
• {List of auto-executed actions}

📋 {N} DECISIONS NEED YOU:
1️⃣ {Decision} → {Option A / Option B / Option C}
2️⃣ ...

📊 PULSE:
• Yesterday: ₹{sales} · {orders} orders · ACOS {%}
• Site: {sessions} sessions · {%} checkout conversion
• {leads} new leads · {reviews} new reviews

━━━━━━━━━━━━━━━━━━━━━━━━━
Reply with number to decide, or ask me anything.
```

### Ad hoc queries (any time)

You talk to CEO naturally. Examples:

| Query | CEO behaviour |
|---|---|
| "Why did sales drop yesterday?" | Reads analyst + ads memory → root cause |
| "What's our best performing product?" | Reads product + ads memory → instant answer |
| "Write a Diwali blog post" | Dispatches Content Writer live → returns draft |
| "What should I focus on this week?" | Synthesizes all memory → top 3 priorities |
| "Approve 1" | Routes decision to owning agent for execution |

### Event triggers (Phase 2)

| Event | Agent triggered |
|---|---|
| New order | Operations |
| New review posted | Customer Relations |
| Vercel deploy complete | Website QA |
| Lead form submitted | Customer Relations |

Requires small webhooks in the Next.js app. Built after core agents are stable.

---

## Build Sequence

| Phase | Work | Goal |
|---|---|---|
| 1 | Create `.claude/memory/` system + memory format | Foundation |
| 2 | Write 5 new agent files (CEO, Data Analyst, Product Manager, Content Writer, Customer Relations, Operations) | New roles |
| 3 | Upgrade 5 existing agents to write memory files | All specialists memory-aware |
| 4 | Update Vercel schedule → point to `ceo.md` | CEO replaces morning brief |
| 5 | Add event webhooks to Next.js app | Proactive triggers |

---

## File Map

### New files to create:
```
.claude/agents/ceo.md
.claude/agents/data-analyst.md
.claude/agents/product-manager.md
.claude/agents/content-writer.md
.claude/agents/customer-relations.md
.claude/agents/operations.md
.claude/memory/               ← directory (gitignored, runtime state)
```

### Files to upgrade:
```
.claude/agents/amazon-listing.md   → add memory write
.claude/agents/amazon-ads.md       → add memory write
.claude/agents/marketing-manager.md → rename from meta-ads.md, expand scope
.claude/agents/website-qa.md       → add memory write
.claude/agents/deploy.md           → add memory write
```

### Files to retire:
```
.claude/agents/morning-brief.md    → replaced by ceo.md
.claude/agents/api-health.md       → absorbed into ceo.md
.claude/agents/blog-writer.md      → absorbed into content-writer.md
.claude/agents/seo-optimizer.md    → absorbed into content-writer.md
```

### Schedule update:
```
Existing routine → update prompt to invoke ceo.md instead of morning-brief.md
```

---

## Success Criteria

- You never open the admin dashboard to check on the business
- Every morning brief contains at least one auto-executed action (not just reports)
- Ad hoc questions answered in under 60 seconds without you specifying which agent to ask
- Tier 2 decisions surfaced proactively — you're never surprised by something agents should have caught
