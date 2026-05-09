# GA4 Analytics Setup Guide

One-time setup to connect the Google Analytics Data API. Takes ~5 minutes.

## Step 1: Google Cloud Service Account

1. Go to https://console.cloud.google.com
2. Create a project or select an existing one (e.g. "NitiVidya")
3. In the search bar, search for **"Google Analytics Data API"** → Click **Enable**
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
   - Name: `nitividya-analytics`
   - Click **Create and Continue** → Skip role assignment → Done
5. Click the service account you just created → **Keys tab → Add Key → Create new key → JSON**
6. A `.json` file downloads. Open it — it looks like this:
   ```json
   {
     "type": "service_account",
     "project_id": "...",
     "private_key_id": "...",
     "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
     "client_email": "nitividya-analytics@your-project.iam.gserviceaccount.com",
     ...
   }
   ```

## Step 2: Grant Access to Your GA4 Property

1. Go to https://analytics.google.com → **Admin** (bottom left gear icon)
2. Under **Property**, click **Property Access Management**
3. Click **+** → **Add users**
4. Enter the `client_email` from your JSON file
5. Role: **Viewer** → **Add**

## Step 3: Find Your GA4 Property ID

1. In Google Analytics → Admin → Property Settings
2. Copy the **Property ID** (a number like `123456789`)

## Step 4: Add Environment Variables

Add these to your `.env` file AND to Vercel (Dashboard → Project → Settings → Environment Variables):

```env
GA4_PROPERTY_ID=123456789

GA4_CLIENT_EMAIL=nitividya-analytics@your-project.iam.gserviceaccount.com

# Copy the private_key value from the JSON file exactly as-is
# The \n characters are important — keep them
GA4_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
```

**Important for Vercel:** When pasting the private key, paste the entire value including the `-----BEGIN/END-----` lines with `\n` characters. Do NOT add extra quotes.

## Step 5: Test It

```bash
# Test locally (after adding to .env)
curl http://localhost:3000/api/admin/analytics

# Test production (after adding to Vercel env vars + deploying)
curl https://www.nitividyabooks.com/api/admin/analytics
```

Expected response: JSON with `overview`, `purchaseFunnel`, `leadFunnel`, `topPages`.

If you see `"error": "GA4 not configured"` → env vars not set.
If you see `"error": "GA4 authentication failed"` → service account not added as Viewer to GA4.

## What Gets Tracked (Already Set Up)

These events are already flowing to GA4 from your site:

| Event | Funnel Stage |
|-------|-------------|
| `page_view` | Site visit |
| `page_view` on `/books/*` | Product viewed |
| `add_to_cart` | Cart |
| `checkout_started` | Checkout |
| `address_completed` | Address step |
| `razorpay_selected` | Payment selected |
| `payment_success` | Purchase complete |
| `lead_modal_shown` | Lead modal impression |
| `lead_captured` | Phone number submitted |

All events are sent via GA4 direct (`G-1E32RCMV28`). The site previously used a GTM container (`GTM-XXXXXX` placeholder) which was removed on 2026-05-09 — GA4 now loads directly via `NEXT_PUBLIC_GA_ID`. Events flow through `window.dataLayer` → GA4 script.
