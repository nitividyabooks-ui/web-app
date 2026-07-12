# Website QA Memory
Last updated: 2026-07-12 21:33 IST

## What I know
- The web-vitals performance release is live on `https://www.nitividyabooks.com` from application commit `4b3b94a`.
- Production HTTP checks: homepage 200, animals product page 200, books catalog 200 during Playwright QA, unknown product 404, and bare `/api/products` 400 as required by the new bounded cart API.
- Deployed homepage/product HTML includes `inside-pages-v2.webp`; homepage HTML has zero `anim-delay-2` or Lenis markers.
- The production optimizer returned the v2 animals inside image at 640×322 in AVIF/HEIF format and 11,906 bytes. No 14,320px response was delivered.
- Production read-only Playwright smoke tests passed 10/10: homepage title/content/hero/navigation/console/mobile overflow and product image/price/add-button/title/description/catalog/404.
- `/api/admin/health` returns valid JSON with HTTP 503 and summary `7 passed · 1 failed · 0 warnings`. Only Anthropic API fails due to low credits; all core commerce/storage/database/email checks pass.
- Before deployment, the final local production build passed, the full desktop/mobile suite passed 104/104, focused deploy checks passed 26/26, and scoped lint/TypeScript checks were clean.
- The latest throttled local mobile benchmark at final application code measured FCP 896 ms, LCP 896 ms, CLS 0, approximate TBT 57 ms, 43 requests, 544.99 KiB encoded transfer, and 172.60 KiB JavaScript. These are local lab values, not production Lighthouse field data.

## What I did automatically
- Performed read-only production curl and Playwright verification after Vercel switched to the new build.
- Confirmed the versioned product image path, absence of the removed motion markers, bounded cart API behavior, and modern responsive optimizer output.
- Did not submit an order, trigger checkout, enter payment details, or modify production data during QA.

## Open items for CEO
1. Refill Anthropic API credits or revise the health check if Anthropic is optional; this is the only current failed health dependency.
2. Run a production throttled Chrome/Lighthouse comparison when desired to validate the local lab Core Web Vitals improvements across the CDN and real network.
3. Fonts remain the clearest residual storefront payload opportunity at approximately 182.6 KiB in the local audit.
4. Resolve the known missing `BlogPost` table warning separately and recheck the historical admin blog API issue.

## Context for other agents
- `deploy`: the application release is live and focused production QA is green; only the Anthropic-credit health failure remains.
- `data-analyst` and `marketing-manager`: deferred analytics code is live, but platform-side event receipt should be validated separately.
- `product-manager`: the animals v2 interior asset is live and delivered at an appropriate responsive size.
- `content-writer`: the known `BlogPost` database-table warning remains an unrelated follow-up.
