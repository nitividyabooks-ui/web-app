# Website QA Memory
Last updated: 2026-10-10 23:59 IST

## What I know
- User approved fixing the October 10 funnel/code issues. These changes are implemented locally; this validation does not establish deployment to nitividyabooks.com.
- Root reports the local production build passed and the combined targeted regression suite passed 168/168 on desktop and mobile in 58.3 seconds. Final targeted lint of modified files and TypeScript passed; one existing image warning remains. Earlier dev-server context errors did not recur in the cold production-server verification.
- Merchandise subtotal, shipping, and payable total now use server-authoritative pricing. The five distinct Miko titles unlock their bundle offer; repeating one title or adding an unrelated product does not unlock it. Completing a partial set adds missing titles rather than duplicating those already in the bag.
- Checkout retains verified payment confirmation after cart clearing. WhatsApp handoff displays a durable send/retry link and distinguishes an order request from a verified payment. Marketing widgets are excluded from checkout, confirmation, and payment routes; browser Back interception is removed.
- Admin analytics now query standard storefront events and map date ranges by the returned dimension. Internal routes are excluded from tracking; bundle journeys are represented. Website YouTube thumbnail clicks and subscribe clicks are measured as clicks, not completed subscriptions or confirmed playback.
- Homepage presents the complete Miko set near the hero using shared pricing and shows Miko interior spreads first. Known YouTube IDs and labels are corrected; embeds remain lightweight. Printables email signup accepts its source, offers immediate downloads, and leaves YouTube subscription optional. Unsupported WhatsApp coupon-delivery promises are removed.
- All known exact seeded sample reviews/testimonials are excluded from public display and rating summaries, including product structured data. Records are preserved. The seed script no longer deletes customer feedback or creates approved/verified/active samples. Genuine future feedback with different text from the same author remains eligible.
- Unsupported board-book, chewing, rounded-corner, and ink-safety claims were removed from the reviewed storefront copy in favour of paperback/picture-book and parent-led reading facts.
- Local production screenshot captures completed for home/PDP at desktop 1440×1000 and mobile 390×844 under test-results/manual-qa/. Root will perform visual review. All non-GET requests and analytics-service requests were intercepted; no real lead, order, payment, or notification was submitted.
- The production build logs a preexisting missing BlogPost table warning. The application handles it with an empty-blog fallback; the blog database setup remains an external follow-up. Production health, Anthropic credits, channel settings, and actual platform-side analytics receipt were not rechecked during these fixes.

## What I did automatically
- Implemented and reviewed the authorized storefront funnel, lead-capture, YouTube, and truthful-copy fixes locally, coordinated with analytics/commerce specialists.
- Added regressions to existing homepage/product specifications, including mocked subscriber-API acceptance, optional YouTube/download flow, exact sample exclusions, and partial-set completion.
- Captured four local production screenshots after root's successful build and 168-check suite. Updated this local memory. No production database mutation, seed execution, commit, push, or deployment was performed.

## Open items for CEO
1. Obtain owner confirmation before pushing/deploying, as required by the Deploy instructions. Until then the live site is not established to contain these fixes.
2. After deployment, verify standard event receipt in GA4, relevant YouTube click placements, real checkout behaviour without submitting unintended orders, and printable signup against the configured production subscriber table.
3. Provision/migrate the BlogPost table deliberately if blog publishing is needed; preserve the current fallback meanwhile.
4. Reconcile the existing confirmed order lacking a stored payment ID separately; local code changes do not prove its historical payment.
5. Collect genuine customer feedback and supporting purchase evidence before approving reviews or marking them verified. Known samples are hidden, but unrelated future submissions still require proper moderation.

## Context for other agents
- deploy: local production build, TypeScript, targeted lint, and 168 desktop/mobile regression checks are green per root; owner-approved push and deployed smoke verification remain outstanding.
- data-analyst: use standard ecommerce events and direct-bundle funnel stages. Current fixes are local until deployed; website subscribe clicks do not prove subscriptions.
- marketing-manager: known YouTube mappings and honest click instrumentation are corrected locally. Signup fulfils the free-printables promise immediately; no coupon-delivery system was invented.
- product-manager: complete-set eligibility is tied to the five stable Miko IDs, while unrelated products follow their own pricing policy. Confirm contribution margins before adding catalog items.
- content-writer: use genuine evidence-backed customer feedback and actual product formats. The existing missing BlogPost table requires a separate database action before publishing.
