# GA4 Funnel Setup Guide — NitiVidya Books

A step-by-step guide for configuring the GA4 dashboard (property `516454398`, Measurement ID `G-1E32RCMV28`) to match the event tracking shipped in the 2026-06 website redesign. Written to be followed on phone or desktop at [analytics.google.com](https://analytics.google.com).

All events are sent via `src/lib/analytics.ts` using the GA4 standard ecommerce schema. Every event automatically carries `visitor_id` (our first-party visitor cookie). Prices are in rupees, currency `INR`.

---

## 1. Events the site sends

### Purchase funnel (GA4 standard ecommerce)

| Step | Event | Fired when |
|---|---|---|
| 1 | `view_item_list` | /books, home shelf, collection pages (param `item_list_name`) |
| 2 | `select_item` | a product card is tapped |
| 3 | `view_item` | a product detail page loads |
| 4 | `add_to_cart` | Add to bag (PDP, quick-add, bundle) |
| 5 | `view_cart` | cart drawer opens |
| 6 | `begin_checkout` | /checkout loads with items |
| 7 | `add_shipping_info` | delivery form completed (includes pincode) |
| 8 | `add_payment_info` | payment method chosen (`payment_type`: Razorpay / WhatsApp) |
| 9 | `purchase` | payment success (includes `transaction_id`) |

Also: `remove_from_cart`.

### Lead & engagement events

| Event | Params | Fired when |
|---|---|---|
| `generate_lead` | `lead_source`, `lead_type` (phone/email) | any phone/email capture |
| `sign_up` | `method` | newsletter signup |
| `file_download` | `file_name`, `file_category` | printable worksheet download |
| `whatsapp_click` | `link_location` | any WhatsApp button |
| `video_start` | `video_title`, `link_location` | YouTube embed played |
| `view_promotion` / `select_promotion` | `promotion_name`, `creative_slot` | offer bands, modals, announcement bar |
| `share` | `content_type`, `item_id` | share button on order success |

`lead_source` values: `welcome_modal`, `checkout_phone`, `printables`, `exit_intent`, `footer`, `home_band`, `newsletter`, `product_page`, `blog`, `order_success`.

### Diagnostic events (custom)

- `payment_failure` — `value`, `order_id`, `error_message`, `payment_type`
- `checkout_abandoned` — fired when a begun checkout is left

---

## 2. Mark key events (do this first)

**Admin → Data display → Events**, toggle "Mark as key event" for:

1. `purchase`
2. `generate_lead`
3. `add_to_cart`
4. `begin_checkout`

If an event hasn't appeared yet (no traffic), create it under **Admin → Key events → New key event** by typing the exact name.

## 3. Register custom dimensions

**Admin → Data display → Custom definitions → Create custom dimension**. All are **event-scoped**:

| Dimension name | Event parameter |
|---|---|
| Visitor ID | `visitor_id` |
| Lead source | `lead_source` |
| Lead type | `lead_type` |
| Link location | `link_location` |
| Item list name | `item_list_name` |
| Promotion name | `promotion_name` |
| Payment type | `payment_type` |
| File name | `file_name` |

GA4 free tier allows 50 event-scoped dimensions — these 8 leave plenty of room.

## 4. Build the funnels (Explore)

### Funnel 1 — Purchase funnel

**Explore → Funnel exploration**, name it "Purchase funnel".

Steps:
1. `session_start`
2. `view_item_list`
3. `view_item`
4. `add_to_cart`
5. `begin_checkout`
6. `add_shipping_info`
7. `purchase`

Settings: **Open funnel** ON (visitors can enter at any step), step timeout 30 minutes. Add **Breakdown** = Device category. Add a second tab with Breakdown = First user source/medium.

### Funnel 2 — Lead funnel

Steps:
1. `session_start`
2. `view_promotion`
3. `generate_lead`

Breakdown = **Lead source** (custom dimension). This shows which capture point (welcome modal, checkout, printables, exit intent) actually produces leads.

### Funnel 3 — Checkout micro-funnel

Steps:
1. `begin_checkout`
2. `add_shipping_info`
3. `add_payment_info`
4. `purchase`

**Closed funnel**, 30-minute timeout. This isolates exactly where checkout drops. Add Breakdown = Payment type on a second tab once data accumulates.

## 5. Audiences for remarketing

**Admin → Audiences → New audience → Create custom audience**:

1. **Cart abandoners (7d)** — Include: `add_to_cart` in last 7 days; Exclude: `purchase` in last 7 days.
2. **Engaged browsers, no cart** — Include: `view_item` (event count > 1) in last 14 days; Exclude: `add_to_cart`.
3. **Leads** — Include: `generate_lead`, membership 540 days.
4. **Purchasers** — Include: `purchase`, membership 540 days.

These sync to Google Ads automatically if you link accounts, and mirror the segments to rebuild in Meta Ads Manager.

## 6. Reports to bookmark

- **Monetization → Ecommerce purchases** — revenue per book
- **Engagement → Pages and screens** — top content; filter `/collections/` to watch SEO pages
- **Engagement → Events** — click `generate_lead` and view by Lead source
- **Acquisition → Traffic acquisition** — which channels drive sessions

## 7. Verify with DebugView

1. On your phone or desktop, open the site with `?debug_mode=1` appended to the URL (e.g. `https://www.nitividyabooks.com/?debug_mode=1`), or install the "GA Debugger" Chrome extension.
2. **Admin → DebugView** in GA4.
3. Walk the funnel: home → All Books → open a book → Add to bag → open cart → checkout → fill phone (then stop).
4. Confirm in DebugView, in order: `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `generate_lead`.
5. Tap an event and confirm `visitor_id` and `items` appear in the parameters list.
6. **Reports → Realtime** should show your session and events within ~60 seconds.

Note: events appear in standard reports and Explore with a 24–48 h delay. Custom dimensions only populate for data received *after* they are registered — do step 3 early.
