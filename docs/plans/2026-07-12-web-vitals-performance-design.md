# Web Vitals Performance Design

**Date:** 2026-07-12  
**Status:** Approved  
**Scope:** Public storefront, starting with the homepage and product-detail experience

## Objective

Make NitiVidya feel immediately responsive on mobile and bring the public storefront's Core Web Vitals into the good range without changing its information architecture, commerce behavior, brand palette, or content.

The implementation is performance-first: native browser scrolling takes priority over decorative motion, and critical content must render without animation delays.

## Baseline evidence

A cold installed-Chrome mobile run at 412×823, 4× CPU slowdown, 1.6 Mbps, and 150 ms latency measured:

- TTFB: 84 ms
- FCP: 2.660 s
- LCP: 2.768 s
- CLS: 0.00009
- Approximate TBT: 125 ms
- 66 requests and 787 KB encoded transfer
- 407 KB JavaScript, 182 KB fonts, 78 KB fetch/XHR, and 57 KB initially loaded images

The LCP element is the hero description paragraph. Its CSS animation delay and initially hidden state postpone the LCP timestamp.

The homepage also generated 233,195 bytes of static HTML and a 76,335-byte RSC payload. Complete product records, including unused descriptions and metadata, cross client boundaries.

## Root causes

1. Lenis intercepts native scrolling on every route with a 1.2-second duration and a permanent animation-frame loop.
2. Framer Motion observers and transforms are attached to individual homepage sections and cards, while parallax subscribes elements to scroll progress.
3. Critical hero text is initially hidden and delayed.
4. Full Prisma product records are serialized into interactive client components.
5. Hidden overlays and marketing features are eagerly imported and initialized.
6. Repeated product and footer links generate background RSC prefetch traffic.
7. Product-card `sizes` overstates desktop image width and causes duplicate, oversized derivatives.
8. One 14,320×7,192 inside-page image bypasses effective resizing and is downloaded twice on the affected product page.
9. Analytics and four fonts compete with critical rendering.
10. Sticky backdrop filters increase scrolling paint cost on mobile.

## Architecture

### Native rendering and motion

Remove the global smooth-scroll provider and Lenis dependency. Remove parallax from the hero and lead-capture band. Critical hero copy must be visible in the initial render.

Delete card-level and section-level Framer Motion reveal wrappers from the homepage and books grid. Preserve small CSS hover and entrance effects only where they do not hide critical content, subscribe to scrolling, or run persistent JavaScript. Respect `prefers-reduced-motion` for any remaining CSS animation.

### Storefront data boundaries

Introduce narrow storefront product projections for card, hero, and bundle usage. Prisma queries should select only the fields required by each surface. Client components must receive serializable view models rather than full database records.

Product detail pages may continue using a richer server-side record, but client islands receive only the fields required for their interaction.

### Global client work

Keep cart state available globally, but avoid downloading the full catalog during cart restoration. Replace that migration with either a versioned local-cart migration or a narrow endpoint accepting only stored product IDs.

Load the cart drawer only when it can be opened. Schedule lead-status checking and optional marketing overlays after the critical rendering window. Components that render nothing initially should not contribute their complete code to the initial route bundle when a safe dynamic boundary is available.

### Navigation and prefetch

Preserve prefetch for the primary navigation and primary purchase journey. Disable automatic prefetch for decorative hero covers, repeated product links, footer directories, and other low-intent links that currently create duplicate RSC requests.

### Images and caching

Correct responsive `sizes` values to reflect actual layout widths. Reuse matching image derivatives where the same cover appears in the hero, shelf, and bundle.

Produce display and thumbnail derivatives for the oversized inside-page image, using versioned object paths. The display asset should be approximately 1,200–1,600 pixels wide; the thumbnail should match gallery needs. Increase the Next image minimum cache TTL for stable, versioned sources. Preserve lazy loading below the fold.

If the Supabase object cannot be replaced automatically from repository state, the code must be prepared for versioned paths and the remaining external asset operation must be reported explicitly rather than silently skipped.

### Analytics and fonts

Move nonessential marketing scripts out of the hydration-critical window using an idle/lazy strategy while preserving GA4 page and commerce tracking. Critical business events must still queue safely before the external script finishes loading.

Reduce font preloading to files needed above the fold. Typography must remain visually consistent; system fallbacks must be available immediately.

### Paint containment

Use opaque mobile backgrounds instead of continuous backdrop blur where appropriate. Apply `content-visibility: auto` and a safe intrinsic size to heavy below-fold sections only after verifying that it does not break anchor navigation, horizontal scrolling, or accessibility.

## Error handling and compatibility

- Native scrolling is the fallback and the default; no JavaScript failure may prevent scrolling.
- Lazy overlays must fail closed without blocking cart, checkout, or navigation.
- Analytics loading failures must never affect storefront interaction.
- Product view models must retain stable defaults for optional images and metadata.
- The missing `/images/placeholder-book.jpg` fallback must be replaced with a real, lightweight asset or a code-native fallback.
- All changes must retain reduced-motion behavior, keyboard navigation, and current responsive breakpoints.

## Verification strategy

Implementation follows test-driven development:

1. Add static performance-contract tests that fail while Lenis, parallax, delayed LCP content, incorrect image sizes, and eager low-value prefetch remain.
2. Add unit tests for narrow product projections and cart migration behavior.
3. Run lint, TypeScript/build, and the existing Playwright suite.
4. Run production browser smoke tests for homepage, books, one product page, cart, and checkout entry.
5. Repeat the same throttled Chrome profile used for the baseline.
6. Compare generated HTML/RSC size, request count, JavaScript transfer, image transfer, LCP, CLS, and long tasks.

## Acceptance criteria

- LCP at or below 2.3 seconds under the baseline mobile profile
- CLS at or below 0.05
- Approximate TBT at or below 100 ms
- Immediate native scroll response with no permanent animation-frame loop
- Fewer than 45 initial homepage requests
- Material reduction from 407 KB initial JavaScript
- No full product records serialized into homepage client components
- No display request returns the 14,320px original inside-page image
- At least 50% reduction in affected product-page image transfer
- No cart, checkout, analytics, SEO, responsive-layout, or accessibility regressions

## Delivery boundaries

Implementation is authorized on the checked-out `main` branch without a worktree. Existing unrelated and untracked listing images are preserved. Committing locally is allowed as part of the development workflow. Pushing or deploying still requires explicit owner confirmation under the project's deployment policy.
