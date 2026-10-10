# Product Manager Memory
Last updated: 2026-10-10 23:29 IST

## What I know
- Evidence refreshed from live read-only product/order snapshots and read-only Prisma selected order fields on 2026-10-10. Prior May memories are stale and cannot establish current business health.
- Six active products, all marked in_stock: Nititales MRP ₹349 (stock 100); Miko Festivals ₹249 (80); Manners ₹249 (140); Actions ₹249 (150); Animals ₹249 (120); Gods & Goddesses ₹249 (60). Stock values match May; accuracy against physical inventory has not been checked.
- Snapshot `priceRupees` contains paise (24900/34900), despite the field name. Current pricing code discounts single books 30%: Miko ₹174, Nititales ₹244; five-or-more cart units get 60% off, giving the five-book Miko set ₹500. Free shipping starts at ₹499; otherwise ₹49.
- Four all-time order records, all containing one copy of each of the five Miko books at ₹100 each; recorded order mean ₹500. Three CONFIRMED Razorpay-method records totaling ₹1,500 and one PENDING_WHATSAPP record ₹500. This is order value, not verified settled revenue.
- Order dates IST: 2026-07-23 and 2026-09-09 CONFIRMED with stored payment IDs; 2026-10-04 CONFIRMED with Razorpay order ID but no payment ID; 2026-10-10 PENDING_WHATSAPP without payment IDs. No customer details or raw payment IDs retained here. Live/test payment mode and captured/settled amounts were not verified.
- Last 28 completed IST days (Sep 12–Oct 9) contain one ₹500 CONFIRMED record, with no stored payment ID. Last-seven-day snapshot contains two records totaling ₹1,000; today's record is pending. Snapshot includes pending orders in its revenue totals and flags one overdue order, but only checks orders in the last seven days.
- All Miko titles tie on four order-item rows (three confirmed + one pending); Nititales has zero. There is no evidence of a preferred individual Miko title; the observed demand is for the bundle.
- Competitor examples checked from official brand pages on 2026-10-10: Shumee Ramayana book + 20 memory cards (4+), displayed ₹591 against ₹789 MRP; Fun Sapienza Das Avatar, 25 Hindi/English flashcards (5+), ₹399 against ₹599; Skillmatics First 100 Animals, 50 double-sided cards + activity guide (toddlers), displayed ₹420 against ₹467 and sold out. These validate adjacent offers exist, not their profitability or NitiVidya demand. Prices/promotions may change.
- Live meta descriptions are 114–143 characters and Nititales meta title is 75 characters. Length alone is not an SEO defect; review relevance and search truncation rather than padding copy to an arbitrary length.

## What I did automatically
Read-only review and refreshed this local memory only. No catalog, pricing, customer, payment, or live data changes.

## Open items for CEO
1. Too few confirmed orders to conclude books are unviable. Test a coherent Miko early-learning brand extension before buying a broad toy inventory.
2. Recommended first pilot: one Miko animal/actions colouring and parent activity booklet for age 3–5, using owned artwork, tied to existing books and YouTube rhymes. Start with a free printable sample, 10 parent feedback conversations, then a small 20–30 unit print pilot after costing. Indicative ₹99–149 bundle add-on is a test hypothesis, not a margin-backed price recommendation.
3. Next candidate after validation: bilingual picture cards, parent activity prompts, then a gift sleeve/card around the existing set. Larger puzzles, plush or wooden toys should follow demand evidence and supplier review.
4. Current discount applies to every cart item based on total quantity, with no product/category distinction. Adding toys or add-ons without revisiting pricing could give them 30% or 60% discounts and destroy margin. Check catalog metadata also assumes books (ISBN/pages/author/format).
5. Costs are unknown. Obtain print/packaging/shipping/payment-fee/returns/GST quotes and calculate contribution per order after discount before committing inventory or ad budget.
6. BIS official Toys QCO covers products/material intended for play by children under 14; paper/card games are not automatically exempt. For toys, verify applicable classification and licensed manufacturer/ISI mark before sale. A certified third-party toy add-on is a later option; avoid generic dropship inventory without traceable compliance.
7. Operations/payment specialist should investigate the October 4 confirmed record without stored payment ID and overdue status; no payment API or status mutation called during this review.

## Context for other agents
- Content/marketing: observed orders are complete five-book bundles at ₹500; use a clear bundle demonstration and culturally meaningful gifting/use-case content. No individual title winner.
- Analytics: compare purchase tracking with actual captured payments, not the snapshot's unfiltered revenue totals; Sep12–Oct9 has one confirmed record without payment ID, so zero GA revenue needs investigation but cannot yet be called proven lost purchase tracking.
- Product opportunity: own Miko IP across book + rhyme/video + printable/activity pack provides differentiation without immediately managing unrelated categories.
- Research links: https://www.shumee.in/collections/pretend-and-play-toys/products/ramayana-memory-game-and-book-age-4 ; https://www.thefunsapienza.com/products/das-avatar ; https://www.skillmatics.in/products/first-100-animals-flash-cards-for-toddlers-ages-1-4 ; https://www.bis.gov.in/wp-content/uploads/2020/03/Toy_QC_order.pdf ; https://www.pib.gov.in/PressReleasePage.aspx?PRID=1911846&lang=2&reg=48
