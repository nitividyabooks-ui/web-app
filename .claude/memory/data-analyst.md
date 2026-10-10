# Data Analyst Memory
Last updated: 2026-10-10 23:59 IST

## What I know
- Fresh authenticated GA4 browser report, September 12–October 9, 2026: 97 sessions, 60 engaged sessions, 61.86% engagement rate, 15 seconds average engagement per session, 617 events, and ₹0 recorded revenue. Events report shows 90 total users; home active users for October 3–9 are 34. These are different metrics/windows.
- Acquisition in that 28-day window: direct 38 sessions (39.18%); chatgpt.com / ai-assistant 37 (38.14%); Google organic 10; Bing organic 4; Facebook referral 3; other sources 5. AI and direct traffic may include founder/agent activity; do not assume qualified shoppers.
- Standard events in the same window: view_item 20 events / 13 users; add_to_cart 3 / 1; view_cart 4 / 1; begin_checkout 1 / 1; add_shipping_info 1 / 1; add_payment_info 1 / 1. No purchase event listed. These are event counts, not a validated sequential funnel.
- generate_lead 8 events / 6 users; file_download 32 / 4 users. No explicit YouTube-related event in the listed 19 event names. Downloads are not 32 distinct leads.
- Historical custom dashboard overview mislabeled GA4 date-range rows. Local fix maps named dateRange values, handles missing/reordered rows, and uses inclusive 7/30-day windows. Not deployed yet.
- Local reporting now uses add_to_cart → begin_checkout → purchase as an open funnel; inline/modal/printables leads use page_view → generate_lead. Standard view_item continues to measure discovery without making it a required purchase step. GA4 adds step-number prefixes to response names; requests use unprefixed names. Prior custom zeros are unreliable.
- Local loaders/transports exclude /admin, /api, and /internal paths, and discard queues when entering internal pages. Top Pages filters historical internal paths. Historical overview totals remain potentially contaminated; agent/founder activity on storefront needs GA4 internal-traffic configuration or a dedicated test environment.
- Root inspected a bundle in the browser after recording the historical report; that inspection may generate today's analytics events. The temporary bag was restored to empty; no lead/order/payment submitted.

## What I did automatically
- Implemented approved local analytics fixes, including named reporting ranges, open purchase funnel with honest cohort explanation, all-form lead events, per-item cart pricing, confirmed-receipt purchase/shipping values and reload deduplication.
- Added video_click/youtube_subscribe_click/youtube_channel_click, Amazon, and existing WhatsApp outbound intent helpers. Clicks do not claim playback or completed subscriptions. Preserved supplied UTM parameters during user_phone cleanup; no fabricated assistant campaign tags.
- Added meaningful regressions against mocked GA4 clients/transport and mocked receipt network; observed failures before fixes. All 14 analytics checks pass on desktop and mobile (28 total), including confirmed server totals and reload deduplication on a production build with a test-only GA ID. Root combined verification passed 168/168 checks. TypeScript and targeted lint pass (existing Facebook pixel noscript-image warning).
- No analytics settings, production data, payments, channel settings, or production deployment changed.

## Open items for CEO
1. Deploy approved local fixes after final combined validation. New correctly recorded funnel data is needed before interpreting conversion rates.
2. Reconcile the October 4 confirmed ₹500 order, which has a Razorpay order ID but no stored payment ID, before treating it as captured revenue or a missing GA4 purchase. Four all-time order records are not four verified paid orders.
3. Configure GA4 internal traffic for founder/agent storefront visits and register lead_source/lead_type event-scoped custom dimensions if source segmentation in GA4 reports is desired. Source tags are already emitted; no speculative registration or source filtering was performed. Traffic samples remain too small for reliable checkout conclusions.
4. Align lead success and delivery promises; printables email source is rejected by current API (see website-qa memory).

## Context for other agents
- marketing-manager: acquisition remains low volume; 37 AI-assistant sessions need validation before investing based on that channel. Six lead-event users are a more useful follow-up pool than raw event counts.
- website-qa: prioritise standard event mappings and checkout amount/confirmation defects; avoid attributing observed zeros to abandonment.
- product-manager: all four recorded orders are complete ₹500 sets; current evidence is too small to declare books unviable.
- May 9 analytics outage findings above are superseded by this fresh review; GA4 collection is active.
