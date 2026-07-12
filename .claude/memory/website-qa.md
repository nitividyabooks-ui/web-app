# Website QA Memory
Last updated: 2026-07-12 20:55 IST

## What I know
- Latest QA: read-only Chrome verification of the local production build at `http://localhost:3000` using a 412×823 mobile viewport, 4× CPU slowdown, 1.6 Mbps download, 150 ms RTT, and a cold cache.
- Homepage production baseline → local build: TTFB 84 ms → 5.6 ms; FCP 2.660 s → 0.936 s; LCP 2.768 s → 0.936 s; CLS 0.00009 → 0; approximate TBT 125 ms → 99 ms; load 3.176 s → 2.861 s.
- Homepage production baseline → local build traffic: 66 → 43 requests and 787 KiB → 545.0 KiB encoded transfer. JavaScript fell from 407 KiB to 172.5 KiB; fetch traffic fell from 30 requests / 78 KiB to 10 requests / 17.2 KiB. Fonts remain essentially unchanged at 182.6 KiB. The local totals include resources triggered by the scroll probe, so the image-byte comparison is conservative.
- Final HEAD `18c3126` post-cart-migration sanity: FCP 896 ms, LCP 896 ms, CLS 0, approximate TBT 57 ms, 43 requests, 544.99 KiB encoded transfer, and 172.60 KiB JavaScript. This is performance-neutral or better than the prior local run: paint improved by 40 ms, TBT fell by 42 ms, request count was unchanged, total transfer increased only 32 bytes, and JavaScript increased only 61 bytes.
- Final HEAD immediate 600 px scroll reached `scrollY=600`; the next frame arrived in 31.1 ms under 4× CPU throttling. This is about 4 ms slower than the prior local probe but remains responsive and within normal single-run variance.
- Full desktop and mobile tests passed: 104/104. The final production build also passed.
- Full-project lint still reports 34 errors and 14 warnings that pre-date this work. Scoped lint reported no errors in the changed performance/cart-migration files.
- Homepage LCP is still the hero paragraph, but its delayed animation classes are gone. This is consistent with the 1.832 s LCP improvement.
- Homepage long tasks were 182 ms at 676.5 ms (before FCP), 106 ms at 1,000.2 ms, and 93 ms at 2,172.7 ms.
- Immediate 600 px scroll under throttling produced a scroll event in 26.9 ms and the next frame in 27.1 ms, reaching `scrollY=600`.
- Animals product page local metrics: TTFB 6.2 ms, FCP 956 ms, LCP 1.424 s, CLS 0, approximate TBT 138 ms, load 2.787 s, 41 requests, and 567,716 encoded bytes. Its LCP was the front-cover AVIF requested at `w=640` (42,161 bytes).
- The animals product page uses the versioned `nitividya-the-one-where-miko-meets-animal-inside-pages-v2.webp`. Chrome actually requested the thumbnail at `w=64`, received AVIF (1,005 bytes), and decoded it at 64×32. No image network request exceeded `w=640`; no 14,320 px optimizer response occurred.
- These are single-run direct Chrome lab measurements with approximate TBT, not official Lighthouse scores. Localhost TTFB excludes production internet, edge, and CDN latency.
- Historical remote QA context: the public homepage, product page, blog, and checkout returned HTTP 200 on 2026-05-09; direct `/cart` returned HTTP 404. The public blog page worked while its admin API returned HTTP 500 at that time.

## What I did automatically
- Ran read-only mobile Chrome performance QA against the local production homepage and animals product page.
- Re-ran the identical throttled homepage sanity check against final HEAD `18c3126` after the cart migration and found no material regression.
- Verified the versioned v2 animals image and the browser-selected Next.js optimizer request dimensions and response format.
- Recorded the completed 104/104 desktop/mobile test pass, successful final production build, and scoped-lint pass; no existing full-project lint findings were changed automatically.
- Exercised only a harmless page scroll. No order was submitted, and no checkout or payment details were entered.

## Open items for CEO
1. Deploying or pushing the verified performance changes still requires owner approval.
2. After deployment, rerun the same throttled Chrome audit against production to validate CDN/network behavior and confirm the local FCP/LCP gains hold live.
3. Fonts remain the largest homepage transfer class at 182.6 KiB; reducing font families, weights, or subsets is the clearest remaining payload opportunity.
4. The known `BlogPost` table warning remains and should be resolved separately from this performance verification.
5. Recheck the historical direct `/cart` 404 and `/api/admin/blog` 500 when doing the next full functional QA pass.

## Context for other agents
- `deploy`: the local production build passed the targeted mobile performance verification, but production push and deployment require explicit approval; run post-deploy QA afterward.
- `deploy`: final HEAD `18c3126` also passed the post-cart-migration Chrome sanity check, all 104 desktop/mobile tests, and the production build. The 34 errors and 14 warnings from full lint are pre-existing; changed-file scoped lint is clean.
- `content-writer`: the known `BlogPost` table warning/admin blog issue is still open; public blog availability was previously unaffected.
- `data-analyst` and `marketing-manager`: production analytics was the largest single live-script response in the earlier baseline; the local build excludes comparable production analytics/network behavior, so validate tracking after deployment.
- `product-manager`: the animals interior image now points to the versioned v2 asset and is delivered at an appropriate responsive size.
