# Web Vitals Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the public NitiVidya storefront respond immediately to scroll and reduce critical rendering, hydration, navigation-prefetch, and image costs enough to bring the measured mobile LCP into the good range.

**Architecture:** Restore native scrolling and remove scroll-coupled decoration from the critical path. Send narrow storefront product projections to client islands, defer optional global features, use truthful image sizing/versioned derivatives, and retain only high-intent prefetch and post-critical analytics.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, Next Image, Playwright, Vercel, Supabase Storage

---

### Task 1: Add performance regression contracts

**Files:**
- Create: `tests/e2e/performance-contract.spec.ts`
- Modify: `tests/e2e/homepage.spec.ts`

**Step 1: Write failing static contracts**

Add Playwright tests using `readFileSync` that assert:

```ts
expect(layout).not.toContain("SmoothScrollProvider");
expect(homeSources).not.toContain("@/components/motion/");
expect(hero).not.toContain("anim-delay-2 mt-5");
expect(productCard).toContain("(min-width: 1024px) 240px");
expect(nextConfig).toContain("minimumCacheTTL");
expect(footer).toContain("prefetch={false}");
```

Also assert that `public/images/placeholder-book.svg` exists and that the old Lenis provider is no longer referenced outside its own deletion target.

**Step 2: Add failing runtime contracts**

Extend `homepage.spec.ts` to assert that:

```ts
await page.goto("/");
await expect(page.getByText("Bilingual Hindi-English picture books", { exact: false })).toBeVisible();
expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).not.toBe("smooth");
```

Record all requests made during the first five seconds and assert that a single product RSC URL is not fetched more than once before interaction.

**Step 3: Run tests and verify RED**

Run:

```bash
npx playwright test tests/e2e/performance-contract.spec.ts --project=desktop
```

Expected: failures for Lenis, motion imports, image sizing, cache TTL, prefetch, and missing fallback asset.

**Step 4: Commit the failing contracts**

```bash
git add tests/e2e/performance-contract.spec.ts tests/e2e/homepage.spec.ts
git commit -m "test: add storefront performance contracts"
```

### Task 2: Restore native scrolling and remove critical-path motion

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/Hero.tsx`
- Modify: `src/components/home/BrandStory.tsx`
- Modify: `src/components/home/MikoShelf.tsx`
- Modify: `src/components/home/TestimonialSection.tsx`
- Modify: `src/components/home/LookInside.tsx`
- Modify: `src/components/home/PrintablesHook.tsx`
- Modify: `src/components/home/YouTubeChannelSection.tsx`
- Modify: `src/components/home/LeadCaptureBand.tsx`
- Modify: `src/components/products/BooksGrid.tsx`
- Delete: `src/components/layout/SmoothScrollProvider.tsx`
- Delete: `src/components/motion/Reveal.tsx`
- Delete: `src/components/motion/Parallax.tsx`

**Step 1: Verify the Task 1 tests fail for the expected reasons**

Run the static contract test and confirm the failures point to current scroll/motion code.

**Step 2: Remove synthetic scrolling**

Remove the provider import and wrapper from the root layout. Delete the Lenis provider. Native browser scrolling becomes the only scroll implementation.

**Step 3: Render the LCP content immediately**

Remove `anim-fade-up` and all delay classes from the hero copy and hero cover wrapper. Remove `Parallax` and render the cover composition in its plain container.

**Step 4: Remove observer-per-card motion**

Replace every `Reveal` wrapper with its semantic/plain element. Preserve existing layout classes on the replacement node. Remove `Parallax` from `LeadCaptureBand`. Delete the unused motion components after all imports are gone.

Use static wrappers such as:

```tsx
<div className="snap-start flex-shrink-0 w-[72%] sm:w-[46%] md:w-auto">
  <ProductCard product={product} listName={LIST_NAME} />
</div>
```

**Step 5: Run the focused contracts**

Run:

```bash
npx playwright test tests/e2e/performance-contract.spec.ts --project=desktop
npm run lint
```

Expected: native-scroll and no-motion assertions pass; later task assertions may still fail.

**Step 6: Commit**

```bash
git add src/app src/components tests/e2e
git commit -m "perf: restore native scrolling and remove scroll motion"
```

### Task 3: Introduce narrow storefront product projections

**Files:**
- Create: `src/lib/storefront-products.ts`
- Create: `tests/e2e/storefront-products.spec.ts`
- Modify: `src/lib/products.ts`
- Modify: `src/lib/productFlags.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/books/page.tsx`
- Modify: `src/components/home/Hero.tsx`
- Modify: `src/components/home/MikoShelf.tsx`
- Modify: `src/components/home/LookInside.tsx`
- Modify: `src/components/products/ProductCard.tsx`
- Modify: `src/components/products/MikoBundles.tsx`
- Modify: `src/components/products/BooksGrid.tsx`

**Step 1: Write a failing projection test**

Define the desired public type in the test:

```ts
const projected = toStorefrontProduct(fullFixture);
expect(projected).toEqual({
  id: "book-1",
  slug: "book-1",
  title: "Book One",
  price: 24900,
  ageRange: "0-5",
  coverPath: "covers/book.webp",
  pages: 24,
  format: "Paperback",
  language: "Hindi, English",
  tags: ["bilingual"],
  collections: ["miko-series"],
  heroPriority: 1,
  insideImages: [{ path: "inside.webp", alt: "Inside", order: 1 }],
});
expect(projected).not.toHaveProperty("longDescription");
expect(projected).not.toHaveProperty("meta");
```

**Step 2: Run and verify RED**

```bash
npx playwright test tests/e2e/storefront-products.spec.ts --project=desktop
```

Expected: import/function missing.

**Step 3: Implement the narrow type and selector**

Create `StorefrontProduct`, `storefrontProductSelect`, safe JSON image parsing, and `toStorefrontProduct`. Add `getStorefrontProducts()` using Prisma `select: storefrontProductSelect`.

The type contains only:

```ts
id, slug, title, price, ageRange, coverPath, pages, format,
language, tags, collections, heroPriority, insideImages
```

**Step 4: Move homepage and books listing to the projection**

Use `getStorefrontProducts()` in both pages. Change the relevant component props to `StorefrontProduct`. Use `coverPath` directly instead of carrying the complete `images` array into ProductCard and MikoBundles. Make `isBilingualHindiEnglish` accept a minimal structural type.

**Step 5: Verify projection and build**

```bash
npx playwright test tests/e2e/storefront-products.spec.ts --project=desktop
npm run build
```

Expected: tests and TypeScript pass. Compare `.next/server/app/index.html` and `.next/server/app/index.rsc` with the 233,195-byte and 76,335-byte baselines.

**Step 6: Commit**

```bash
git add src tests/e2e/storefront-products.spec.ts
git commit -m "perf: slim storefront product payloads"
```

### Task 4: Defer optional global client work and narrow cart refresh

**Files:**
- Modify: `src/components/layout/ConditionalComponents.tsx`
- Modify: `src/context/CartContext.tsx`
- Modify: `src/app/api/products/route.ts`
- Create: `tests/e2e/cart-products-api.spec.ts`

**Step 1: Write failing API and lazy-overlay tests**

Test `/api/products?ids=<id>` and require the response to contain only `id`, `title`, `price`, and `coverPath`. Add a static contract asserting that marketing overlays are dynamically imported and gated behind an idle-ready state, while CartDrawer renders only when `isCartOpen` is true.

**Step 2: Verify RED**

```bash
npx playwright test tests/e2e/cart-products-api.spec.ts tests/e2e/performance-contract.spec.ts --project=desktop
```

**Step 3: Implement narrow cart refresh**

Parse a bounded comma-separated `ids` query parameter, reject more than 20 IDs, and use Prisma `findMany` with a narrow `select`. Update CartContext to request only stored IDs and retain the existing sanitation behavior.

**Step 4: Gate optional UI**

Use `next/dynamic` for CartDrawer, LeadCaptureModal, and ExitIntentPopup. Read `isCartOpen` from the cart context and load the drawer only on demand. Set `marketingReady` using `requestIdleCallback` with a timeout fallback, then mount the two marketing overlays. Cleanup both idle callback and timeout.

**Step 5: Verify**

```bash
npx playwright test tests/e2e/cart-products-api.spec.ts tests/e2e/cart.spec.ts --project=desktop
npm run lint
```

**Step 6: Commit**

```bash
git add src tests/e2e
git commit -m "perf: defer optional storefront client work"
```

### Task 5: Correct image delivery, cache policy, and low-value prefetch

**Files:**
- Modify: `src/components/products/ProductCard.tsx`
- Modify: `src/components/home/Hero.tsx`
- Modify: `src/components/home/LookInside.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/products/ProductImageGallery.tsx`
- Modify: `src/components/products/InsideBookPreview.tsx`
- Modify: `src/lib/storage.ts`
- Modify: `next.config.ts`
- Create: `public/images/placeholder-book.svg`
- Create or upload: versioned display and thumbnail derivatives for `nitividya-the-one-where-miko-meets-animal-inside-pages`

**Step 1: Confirm focused contracts still fail**

Run the performance contract and confirm failures for ProductCard sizes, cache TTL, low-value prefetch, and placeholder.

**Step 2: Correct responsive sizes**

Use a truthful ProductCard sizes string:

```tsx
sizes="(max-width: 639px) 72vw, (max-width: 767px) 46vw, (max-width: 1023px) 33vw, (min-width: 1024px) 240px"
```

Align repeated hero/bundle derivatives where actual layout width permits.

**Step 3: Fix the oversized inside image**

Fetch the current Supabase source to a temporary path, resize/re-encode a display derivative around 1,600px wide and a gallery thumbnail around 480px wide, verify their dimensions and file sizes, and upload them using versioned Supabase object names if credentials permit. Update product image metadata through the existing product/admin data path or a controlled database update so gallery and InsideBookPreview use the correct derivative once each.

If external upload credentials are unavailable, keep the generated optimized files under `public/product-images/` and update the affected product mapping explicitly. Do not leave the 14,320px asset on any display path.

**Step 4: Add cache and fallback policy**

Set a high `minimumCacheTTL` for versioned remote images. Add the lightweight SVG placeholder and point `storage.ts` to it.

**Step 5: Disable low-value prefetch**

Add `prefetch={false}` to decorative hero cover links, LookInside repeated product links, and footer directory links. Keep primary navigation and primary CTA prefetch enabled.

**Step 6: Verify**

```bash
npx playwright test tests/e2e/performance-contract.spec.ts tests/e2e/product.spec.ts --project=desktop
npm run build
```

Use Chrome or direct optimizer requests to assert that the affected display URLs no longer return a 14,320px image.

**Step 7: Commit**

```bash
git add src public next.config.ts tests/e2e
git commit -m "perf: optimize storefront image delivery"
```

### Task 6: Move tracking and paint work out of the critical path

**Files:**
- Modify: `src/components/analytics/GoogleTagManager.tsx`
- Modify: `src/components/analytics/FacebookPixel.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/products/BooksGrid.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `tests/e2e/performance-contract.spec.ts`

**Step 1: Add failing contracts**

Require GA and Facebook scripts to use `lazyOnload`, forbid mobile `backdrop-blur-md` on sticky surfaces, and require below-fold containment utilities to include a safe intrinsic size.

**Step 2: Verify RED**

Run the performance contract.

**Step 3: Defer scripts safely**

Change external analytics script strategies to `lazyOnload`. Keep the inline queue/bootstrap available so early ecommerce events are queued rather than lost.

**Step 4: Reduce scroll paint cost**

Use opaque paper backgrounds on mobile and apply backdrop blur only from an appropriate desktop breakpoint. Add a reusable below-fold containment class using:

```css
content-visibility: auto;
contain-intrinsic-size: auto 800px;
```

Apply it only to large below-fold homepage sections after anchor and layout checks.

**Step 5: Reassess fonts**

Inspect the production build's emitted fonts. Retain brand typography but stop preloading any font file not needed above the fold. Do not change typography solely to satisfy a byte target.

**Step 6: Verify and commit**

```bash
npx playwright test tests/e2e/performance-contract.spec.ts tests/e2e/homepage.spec.ts --project=desktop
npm run lint
git add src tests/e2e
git commit -m "perf: defer tracking and reduce scroll paint"
```

### Task 7: Full verification and performance comparison

**Files:**
- Modify if needed: `.claude/memory/website-qa.md`
- Modify if needed: `docs/plans/2026-07-12-web-vitals-performance-implementation.md`

**Step 1: Run static and behavioral checks**

```bash
npm run lint
npm run build
npm test
```

Expected: lint, production build, and desktop/mobile Playwright suites pass. Existing environment-only API health failures must be separated from application regressions.

**Step 2: Measure generated output**

Record:

- `.next/server/app/index.html` bytes
- `.next/server/app/index.rsc` bytes
- First-party homepage JavaScript raw and gzip totals
- Font bytes

Compare with the recorded baseline.

**Step 3: Repeat Chrome mobile audit**

Use the same 412×823, 4× CPU, 1.6 Mbps, 150 ms profile. Record TTFB, FCP, LCP, CLS, approximate TBT, request count, transfer by type, and long tasks.

**Step 4: Run interaction QA**

Verify homepage native scrolling, primary CTAs, product navigation, filters, add-to-cart, cart persistence, checkout entry, lead forms, reduced motion, mobile overflow, and console/network errors. Never submit a real order or payment.

**Step 5: Update QA memory**

Write the timestamped result and any residual issues to `.claude/memory/website-qa.md` using the project's required format.

**Step 6: Final review and handoff**

Run spec-compliance and code-quality reviews over all commits. Fix all important findings and rerun the affected tests. Report local commits and measured before/after results. Do not push or deploy without explicit confirmation.
