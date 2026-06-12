# Root loading.tsx caused site-wide soft 404s

**Found**: 2026-06-12, during redesign Phase 8.

A root `src/app/loading.tsx` creates a Suspense boundary above every page. Next.js (16) streams the layout shell + loading state immediately with HTTP **200**, so any later `notFound()` in a page (unknown `/books/[slug]`, `/blog/[slug]`, `/collections/[slug]`) rendered the not-found UI **with status 200** — soft 404s on every dynamic route, in production builds too (not just dev).

**Fix**: deleted `src/app/loading.tsx`. Nearly all consumer pages are SSG so the spinner bought nothing. After removal, unknown slugs return real 404s.

**Also**: `/collections/[slug]` additionally sets `export const dynamicParams = false` (fixed, code-defined set). Do NOT add that to `/books/[slug]` or `/blog/[slug]` — their content is DB-driven and can appear after build.

**Rule**: do not reintroduce a root-level `loading.tsx`. Per-route loading boundaries below the slug check are fine.
