# NitiVidya Website Redesign — Master Plan

> On execution start, copy this plan into the repo at `docs/plans/2026-06-11-website-redesign-master-plan.md` so subagents and future sessions can reference it.

## Context

NitiVidya is a new Indian cultural children's book brand (5 Miko books ₹249 + Nititales hardcover ₹349, ages 0–5, bilingual Hindi+English) with near-zero traffic today. The consumer site works (Razorpay + WhatsApp checkout, cart, blog, lead capture) but the design is inconsistent, uses emojis, and the GA event taxonomy is ad hoc with no documented funnels. The goal is a complete consumer-facing redesign that:

1. Looks elite-designer quality, mobile-first (most users are on mobile)
2. Maximizes Home → Listing → Detail → Checkout conversion
3. Builds trust for a brand nobody has heard of (6 SKUs, no reviews on site yet)
4. Captures young mothers' contact info (phone-first, email second)
5. Has clean GA4 funnel tracking + a how-to doc for the GA dashboard
6. Ranks for "children's books", "books for 2-5 year old", etc.

**Decisions approved by owner:**
- **In-place rebuild** — keep this Next.js 16 app, Prisma models, checkout/payment APIs, admin panel. Rebuild design system, all consumer pages, GA tracking.
- **Design direction: Warm Editorial Premium** — cream paper backgrounds, serif display type, illustration-led, muted Indian-craft palette (terracotta, marigold, deep evergreen). Premium-publisher trust signal.
- **SEO: age/topic landing pages first** — no programmatic city/state pages (thin-content risk).
- **PDP: site checkout primary, Amazon as small secondary text link.**

**Hard constraints:**
- NO emojis anywhere in the UI (use lucide-react icons only)
- Mobile-first: design every component at 375px first, then scale up
- Do not touch: `src/app/admin/`, `src/app/api/admin/`, payment/order API routes, Prisma schema for orders/payments, Amazon seller tooling
- Backticks in `src/lib/prompts.ts` must stay escaped (don't touch that file anyway)
- DB: PgBouncer pooler — no `prisma db push`; schema changes via `prisma migrate` or Supabase SQL Editor

**Current-state facts (verified):**
- Stack: Next.js 16 App Router, React 19, Tailwind 4 (CSS-first `@theme` in `src/app/globals.css`), framer-motion, lenis, Radix accordion, lucide-react
- Pages: `/`, `/books`, `/books/[slug]`, `/checkout`, `/blog`, `/free-activity-kit`, `/story-time`, `/miko-reading-journey`, `/about`, `/contact`, `/faq`, policies
- Tracking: `src/lib/gtm.ts` (pageview + trackEvent, GA4 ID `G-1E32RCMV28` direct), `src/lib/checkout-analytics.ts` (mixed custom + GA4-standard events)
- Lead infra in DB already: `Lead` (phone, visitorId), `EmailSubscriber` (email, source), `User` (mobile), `CampaignHit` (UTM), `Review`, `Testimonial`
- JSON-LD exists only on FAQ page, PDP, ProductFAQ
- **Bug:** `src/app/sitemap.ts` uses `https://nitividya.com` — real domain is `https://www.nitividyabooks.com`
- Playwright tests exist (`tests/`, `npm test`, `npm run test:prod`)
- Catalog (6 published products) lives in Supabase via Prisma `Product` model — query at build/runtime via `src/lib/products.ts`

---

## Workstream 1 — Design System (foundation, do first)

**Decision: build a small custom design system** (shadcn-style: own components, Tailwind 4 tokens, Radix primitives where interaction is complex). Rationale: open-source systems (MUI/Chakra/Mantine) look generic, fight Tailwind 4, and add bundle weight; a 6-SKU brand wins on distinctive identity. We already have Radix + Tailwind 4 — this formalizes it.

### 1a. Tokens — rewrite `src/app/globals.css` `@theme`

Palette (Warm Editorial Premium):

```
--paper:        #FAF6EF   (page background — warm cream)
--paper-deep:   #F3ECE0   (alternate section bg)
--surface:      #FFFFFF   (cards)
--ink:          #1F1B16   (primary text — warm near-black)
--ink-soft:     #5C554B   (secondary text)
--evergreen:    #1E4D3B   (primary brand — CTAs, links)
--evergreen-deep: #143527 (hover/dark sections)
--terracotta:   #C25E40   (accent — sale badges, highlights)
--marigold:     #E2A93B   (accent — stars, festive touches)
--marigold-soft:#F6E7C6   (soft highlight bg)
--blush:        #EFDDD3   (soft accent bg)
--hairline:     rgba(31,27,22,0.10)
```

Type: **Fraunces** (serif display, via `next/font/google`, weights 500/600, `opsz` axis) for headings + prices; **Nunito Sans** for body/UI (keep — already loaded as `--font-nunito`). Define a fluid type scale with `clamp()`. Drop Baloo.

Radius: cards 16px (down from 24 — more editorial), buttons 9999px (pill), inputs 12px. Shadows: soft, warm-tinted, 2 levels only. Motion: 150–250ms ease-out micro-interactions; framer-motion only for hero/scroll reveals; respect `prefers-reduced-motion`.

Keep the legacy compat variable block temporarily so untouched files don't break mid-migration; delete it in the final cleanup task.

### 1b. Core components — `src/components/ui/`

Build/rebuild: `Button` (primary/secondary/ghost/whatsapp variants, 48px min height on mobile), `Badge` (age, bilingual, bestseller, discount), `Card`, `Input`/`PhoneInput` (+91 prefix), `SectionHeading` (eyebrow + serif title + subtitle), `Price` (MRP strikethrough + sale + % off), `StarRating`, `Accordion` (restyle existing Radix), `Drawer/Sheet` (cart, bundle), `StickyBar` (mobile PDP buy bar), `TrustStrip` (icon + label row: COD/secure payment, free shipping ₹499+, easy returns, made in India).

Rules enforced repo-wide: no emoji glyphs in any `src/` file (add a simple grep check to `npm run lint` or a script); all icons lucide-react; tap targets ≥44px; one primary CTA per viewport.

---

## Workstream 2 — Page Redesigns (conversion funnel)

All pages: server components for content, client islands for interaction (current pattern). Mobile layout designed first.

### 2a. Home `/` (`src/app/page.tsx` + `src/components/home/`)

Section order (each section is a separate component):
1. **Announcement bar** — single line: launch offer (no emoji, no badge-pill clutter)
2. **Hero** — replace carousel with ONE static hero (carousels depress CTR): serif headline ("Stories that feel like home." or similar from brand doc), subline (bilingual books for ages 0–5), primary CTA "Shop the Miko Series" → `/books`, secondary "See inside a book". Large book-stack/lifestyle image. ASSET: hero lifestyle photo or composed book-stack render.
3. **Trust strip** — 4 items (free shipping ₹499+, secure payments, easy returns, 10k+ happy reading minutes / real stat when available)
4. **Miko series shelf** — 5 books, horizontal scroll on mobile with snap, age + bilingual badges, price, quick-add
5. **Bundle block** — complete-set offer with savings math shown (₹1245 → bundle price), single CTA
6. **"Why NitiVidya" / brand story strip** — 3 editorial cards: Indian values, bilingual learning, made for ages 0–5; link to `/about`
7. **Social proof** — testimonials (existing `Testimonial` data) with author name + "Mother of 2, Pune" style attribution; Amazon star ratings if importable
8. **Look inside** — 3–4 interior spreads in a swipeable gallery. ASSET: interior page photos/scans per book
9. **Free printables hook** — "Free Miko activity sheets" card → `/free-printables` (lead magnet, see WS4)
10. **YouTube / Story Time** — embed 1 featured video + CTA to `/story-time` and channel subscribe link
11. **Lead capture band** — phone-first "Join Miko's Club on WhatsApp — 10% off first order" (see WS4)
12. **Footer** — full nav, policies, contact, social, payment method icons

### 2b. Listing `/books` (`src/app/books/`, `src/components/products/`)

- Clean grid: 2-up mobile, 3-up desktop. Card = cover (4:5), title, age badge, bilingual badge, rating stars + count, price with discount, "Add to bag" button directly on card
- Filters simplified to two pill rows: Age (0–1, 1–3, 3–5) and Theme (Animals, Festivals, Mythology, Manners, Actions) — driven by existing `tags`
- Bundle banner card inline in the grid (position 3) — "Get all 5, save X%"
- `select_item` GA event on card tap (see WS3)

### 2c. Product detail `/books/[slug]`

Mobile order: gallery (cover + interiors, swipe) → title + rating → price block (sale price, MRP struck, % saved) → **sticky bottom buy bar** (Add to bag + price, appears after scroll past primary CTA) → bullet benefits (what child learns) → bundle upsell ("Complete the set, save X%") → look-inside spreads → reviews (existing `Review` model; seed with real Amazon review text once available) → specs accordion (pages, format, language, dimensions, age) → delivery + returns accordion → FAQ accordion → "Prefer Amazon? Buy there instead" small text link (`amazonUrl`) → related books
- Keep `ProductViewTracker` pattern but emit GA4-standard `view_item`
- JSON-LD `Product` with `offers`, `aggregateRating` (only when reviews exist), `BreadcrumbList`

### 2d. Cart + Checkout (`src/components/cart/CartDrawer.tsx`, `src/app/checkout/`)

- Cart drawer: line items, bundle-completion nudge ("Add 2 more, unlock 20% off"), free-shipping progress bar (₹499 threshold), single checkout CTA + WhatsApp order alternative below
- Checkout page: single page, mobile-optimized — phone number FIRST field (creates/updates `Lead` immediately on blur — captures contact even on abandonment), then name/address/pincode, then payment (Razorpay primary, WhatsApp order fallback). Trust signals beside pay button (Razorpay secure badge, return policy link)
- Keep all existing API routes and payment logic untouched — this is a UI + event-tracking reskin of the flow
- Success page: order summary + "Get order updates on WhatsApp" opt-in + share/review ask

### 2e. Supporting pages

- `/about` — founder story page (trust pillar for a new brand). ASSET: founder photo + 3–4 paragraph story
- `/story-time` — redesign as YouTube hub: featured video, episode grid, subscribe CTA. ASSET: YouTube channel URL + 3–6 video IDs
- `/faq`, `/contact`, policies — restyle with new system, keep content
- Header: logo, Books, Free Printables, Story Time, About, Bag. Mobile: bottom-sheet menu. Persistent WhatsApp chat button (floating, bottom-left, small)
- 404 page with books shelf

---

## Workstream 3 — GA4 Rebuild + Funnel Documentation

### 3a. New analytics module `src/lib/analytics.ts`

Replace ad hoc event names with **GA4 standard ecommerce schema** (clean break — site has ~no traffic, no historical continuity worth preserving). Typed functions, one per event. All events carry: `visitor_id` (existing cookie), standard `items[]` array (item_id, item_name, item_category: "Books", item_variant: age range, price in rupees not paise, quantity).

| Funnel step | Event | Fired from |
|---|---|---|
| Listing view | `view_item_list` | `/books`, home shelf (with `item_list_name`) |
| Card tap | `select_item` | ProductCard |
| PDP view | `view_item` | PDP tracker |
| Add to cart | `add_to_cart` | AddToCart, quick-add, bundle |
| Remove | `remove_from_cart` | Cart drawer |
| Cart view | `view_cart` | Cart drawer open |
| Checkout start | `begin_checkout` | Checkout page mount |
| Contact captured | `add_shipping_info` | Address step complete |
| Payment selected | `add_payment_info` | Razorpay/WhatsApp selection |
| Purchase | `purchase` | Payment success (with `transaction_id`) |

Lead/engagement events: `generate_lead` (params: `lead_source`: welcome_modal / checkout_phone / printables / exit_intent / footer, `lead_type`: phone|email), `sign_up` (newsletter), `file_download` (worksheet, with `file_name`), `whatsapp_click` (params: `link_location`), `video_start` (YouTube embeds), `view_promotion` / `select_promotion` (bundle blocks, announcement bar), `share`. Keep `payment_failure` and `checkout_abandoned` as custom diagnostic events.

Delete `src/lib/checkout-analytics.ts` after migrating all call sites; `src/lib/gtm.ts` stays as the low-level transport.

### 3b. Deliverable doc: `docs/ga4-funnel-setup.md`

Step-by-step GA4 dashboard guide (written for the owner, on phone or desktop):
1. **Mark key events**: Admin → Events → mark `purchase`, `generate_lead`, `add_to_cart`, `begin_checkout` as key events
2. **Register custom dimensions**: Admin → Custom definitions → `visitor_id`, `lead_source`, `link_location`, `item_list_name` (event-scoped)
3. **Funnel 1 — Purchase funnel** (Explore → Funnel exploration): session_start → view_item_list → view_item → add_to_cart → begin_checkout → add_shipping_info → purchase. Open funnel, 30-min step timeout, breakdown by device + first-user source
4. **Funnel 2 — Lead funnel**: session_start → view_promotion → generate_lead, breakdown by `lead_source`
5. **Funnel 3 — Checkout micro-funnel**: begin_checkout → add_shipping_info → add_payment_info → purchase (find exact drop step)
6. **Audiences for remarketing**: "Added to cart, no purchase (7d)", "Viewed PDP 2+, no add_to_cart", "Leads (generate_lead)", "Purchasers" — these sync to Google Ads / are exportable for Meta
7. **Reports to bookmark**: Monetization → Ecommerce purchases; Engagement → Pages; Acquisition → Traffic acquisition
8. Verification steps using GA4 DebugView + Realtime

### 3c. Verification

Playwright spec that walks home → listing → PDP → add to cart → checkout and asserts `window.dataLayer` contains each expected event with correct shape.

---

## Workstream 4 — Lead Capture & Retention (young mothers' contact info)

Phone-first (WhatsApp is the channel in India), email second. All capture points write to existing `Lead` / `EmailSubscriber` models via existing API patterns and fire `generate_lead`.

1. **Free Printables library** — rename/expand `/free-activity-kit` → `/free-printables`. Grid of downloadable worksheets (coloring pages, English alphabet, Hindi varnamala, numbers 1–10, festival activities — Miko-branded). Gate: enter phone OR email once (stored, cookie remembers), then all downloads unlocked. Each download fires `file_download`. New `WorksheetDownload` tracking can reuse `EmailSubscriber.source`/`Lead.meta` — no schema change required initially. **ASSET: 6–10 worksheet PDFs (A4, printable). I will provide the list of which worksheets to create.**
2. **Welcome offer modal** — first visit, 20s delay or 50% scroll: "10% off your first order" for phone number with WhatsApp opt-in checkbox. Frequency-capped (once per 14 days via localStorage). Rebuild existing `LeadCaptureModal` in new design.
3. **Exit intent** (desktop) / back-gesture-safe scroll trigger (mobile): printables offer instead of discount (different angle). Rebuild existing `ExitIntentPopup`.
4. **Checkout phone capture on blur** — highest-quality leads; captures abandoners (see 2d)
5. **Order success WhatsApp opt-in** + post-purchase review ask
6. **Footer newsletter** — email, low-key
7. **Blog inline capture** — printables CTA inside posts (existing `BlogEmailCapture`, restyled)

Retention (site-side scope only): "Miko's Club" framing everywhere — one club, two channels (WhatsApp + email). Actual campaign sending stays with the marketing-manager agent / manual WhatsApp — out of scope here.

---

## Workstream 5 — SEO

### 5a. Technical fixes (do early, cheap wins)

- Fix `src/app/sitemap.ts` domain → `https://www.nitividyabooks.com`; set `metadataBase` in root layout; canonical URLs on every page via Metadata API
- Self-referencing canonicals; `robots.ts` check (allow all consumer pages, block `/admin`, `/api`, `/checkout`, `/payment`)
- JSON-LD coverage: `Organization` + `WebSite` (root layout), `Product` + `BreadcrumbList` (PDP), `ItemList` (listing), `Article` (blog posts), `FAQPage` (FAQ + PDP FAQs — already partially exists, standardize into a `src/components/seo/JsonLd.tsx` helper)
- Heading hierarchy: exactly one `h1` per page, logical h2/h3 nesting (audit each redesigned page as built)
- Image discipline: `next/image` everywhere, descriptive alt text (include book title + age range naturally), AVIF/WebP
- Core Web Vitals: hero image `priority`, no carousel JS on initial paint, lenis only on desktop, font `display: swap`

### 5b. Age/topic landing pages — `src/app/collections/[slug]/page.tsx`

Statically generated, genuinely differentiated content (300–500 words each + curated products + FAQ block + internal links). Initial set (8 pages), target keyword in parentheses:

- `books-for-1-year-old` ("books for 1 year old")
- `books-for-2-year-old` ("books for 2 year old", "books for 2-5 yr old")
- `books-for-3-year-old` ("books for 3 year old")
- `hindi-books-for-kids` ("hindi books for toddlers/kids")
- `bilingual-books-for-children` ("bilingual children's books india")
- `indian-mythology-books-for-kids` ("mythology books for kids")
- `birthday-gift-books-for-toddlers` ("birthday gift for 2 year old")
- `baby-shower-gift-books` ("baby gift books india")

Each page: unique intro copy (what to look for at this age, why bilingual matters at this age), the matching products (driven by `tags`/`ageRange`), one testimonial, FAQ with `FAQPage` JSON-LD, links to 2 related blog posts + 2 sibling collections. Add to sitemap + header/footer nav ("Shop by age").

Content can be drafted by the content-writer agent; pages reviewed before publish.

### 5c. Blog engine + content plan

- Blog already DB-driven; ensure `Article` JSON-LD, author byline, internal links to collections/PDPs
- 12-post starter plan (titles in the doc, drafted over time): age-by-age reading guides, "best books for X" lists that include Miko honestly among others, festival activity guides (Diwali/Holi with kids), bilingual-parenting how-tos. Each post links to 1 collection + 1 product + printables
- Save keyword→page mapping in `docs/seo-keyword-map.md` so every new page has one primary keyword and no two pages compete

---

## Execution Order (phases, each independently verifiable)

| Phase | Scope | Verify |
|---|---|---|
| 0 | Copy this plan to `docs/plans/`; fix sitemap domain + metadataBase + robots (quick wins) | build passes, sitemap shows correct domain |
| 1 | WS1 design system: tokens, fonts, ui/ components | Storybook-less: a `/dev/ui` scratch page (deleted later) or visual check via `npm run dev`; lint passes; no-emoji check passes |
| 2 | WS3a analytics module (build before pages so pages wire to it once) | unit-level: events push to dataLayer correctly |
| 3 | Home + header/footer redesign | Playwright home spec + dataLayer assertions; mobile 375px screenshot review |
| 4 | Listing + PDP redesign | Playwright listing/PDP specs + `view_item_list`/`select_item`/`view_item`/`add_to_cart` assertions |
| 5 | Cart + checkout reskin + checkout events + phone-on-blur lead capture | Full Playwright checkout walk (test mode) incl. dataLayer `begin_checkout`→`purchase`; payment APIs untouched (diff check) |
| 6 | WS4 lead capture: printables library, modals, success-page opt-in | Playwright: gate flow, `generate_lead`/`file_download` events; Lead rows created in DB |
| 7 | WS5b/5c: collections pages, blog polish, JSON-LD everywhere | Rich-results test on PDP/collection/blog URLs; sitemap includes collections |
| 8 | Supporting pages (about, story-time, faq, policies, 404) + legacy token cleanup + emoji sweep | grep for emoji = 0 results in src/; `npm run build` + full `npm test` |
| 9 | Write `docs/ga4-funnel-setup.md` + `docs/seo-keyword-map.md`; deploy; verify events in GA4 DebugView on production | website-qa remote checks; GA4 Realtime shows events |

Deploy per existing flow (push to main → Vercel). Phases 3–8 can each be deployed independently — the design system makes mixed old/new pages tolerable but aim to move fast through 3–5 so the core funnel is coherent.

---

## Assets Required From Owner (provide when ready; placeholders used until then)

| Asset | Used where | Spec |
|---|---|---|
| Hero lifestyle photo (mother/child reading Miko) or styled book-stack shot | Home hero | landscape ≥1600px + portrait crop for mobile |
| Interior spreads, 3–4 per book | PDP look-inside, home section | flat photos/scans, ≥1200px wide |
| Miko character art on transparent background | Brand moments, printables page, 404 | PNG/SVG, high-res |
| Founder photo + short story (3–4 paras) | `/about` | any decent portrait |
| Worksheet PDFs (6–10): coloring, alphabet, Hindi varnamala, numbers, festival | `/free-printables` | A4 PDF, Miko-branded |
| YouTube channel URL + 3–6 video IDs | Home, `/story-time` | links only |
| Real review text (from Amazon/WhatsApp customers) | PDP reviews, testimonials | text + first name + city |
| Payment/trust badge preferences (Razorpay badge ok?) | Checkout, footer | confirm only |

Until assets arrive: book covers (already in DB/storage) + typographic compositions stand in. No emoji placeholders.

---

## Out of Scope (explicitly)

- Admin panel redesign, Amazon seller tooling, Prisma order/payment schema changes
- Actual WhatsApp/email campaign sending (marketing-manager agent's domain)
- City/state pages (revisit only after age/topic pages index and rank)
- New payment methods
