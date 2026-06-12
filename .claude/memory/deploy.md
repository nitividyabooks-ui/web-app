# Deploy Memory
Last updated: 2026-05-09 IST

## What I know
- Last deployment: 2026-05-09 IST
- Last deployment result: Site live, analytics endpoint still erroring
- What was deployed: fix: force REST transport for GA4 clients on Vercel serverless (e4beeec)
- Post-deploy QA: Site checks passed (homepage/books/blog all 200, Miko content found). Analytics endpoint failed.
- Current production commit: e4beeec

## What I did automatically
- Pushed commit e4beeec to origin/main
- Waited for Vercel build to complete
- Ran post-deploy curl checks
- Called /api/admin/analytics endpoint as requested

## Open items for CEO
The analytics endpoint `/api/admin/analytics` is returning:

```json
{
  "error": "undefined undefined: undefined"
}
```

The REST transport fix (e4beeec) deployed successfully. The error "undefined undefined: undefined" persists. This pattern typically means a GA4 API error where the status code or message from Google is `undefined` — suggesting the GA4 client is initializing but the API call is failing at the Google side.

Likely causes:
1. GA4_CLIENT_EMAIL or GA4_PROPERTY_ID env var is missing or wrong in Vercel production
2. The service account does not have Viewer access granted on the GA4 property (property 516454398)
3. The private key, while correctly formatted, may belong to a different service account than the one whose email is in GA4_CLIENT_EMAIL

Recommended next action: Check Vercel dashboard → Environment Variables → verify GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY, and GA4_PROPERTY_ID are all set and match the same service account in Google Cloud Console.

## Context for other agents
- Production is live: yes
- Last deploy was: GA4 REST transport fix (e4beeec)
- Any known issues from last deploy: Analytics endpoint returns "undefined undefined: undefined" — GA4 credentials mismatch or missing env vars in Vercel
