# Local dev: next/image optimizer 500s (corporate proxy)

On the owner's Cars24 laptop, `/_next/image` requests for some remote images
(Supabase logo.png, etc.) return 500 in `npm run dev` with
`TypeError: fetch failed ... SELF_SIGNED_CERT_IN_CHAIN`.

**Cause**: corporate TLS-intercepting proxy (Zscaler-style) breaks Node's fetch
inside the Next image optimizer. NOT a code bug. Production (Vercel) is fine.

**Implication**: broken images in local screenshots/dev are expected for some
remote assets. Verify image rendering on the Vercel deployment, not locally.
Browser-direct fetches (curl, <img>) work — only the server-side optimizer fails.

Also seen in dev log: Tailwind/Next 16 deprecation warning "middleware file
convention is deprecated, use proxy instead" — harmless for now.
