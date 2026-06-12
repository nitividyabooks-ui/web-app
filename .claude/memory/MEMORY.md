# Technical Memory Index

Non-obvious technical facts about this codebase. Agent memory files
(amazon-ads.md, operations.md, etc.) are separate and owned by their agents.

- [next/font variables must be on html, not body](nextfont-variables-on-html.md) — custom property var() resolution gotcha that silently breaks heading fonts
- [Local dev image optimizer 500s](local-dev-image-optimizer-proxy.md) — corporate TLS proxy breaks /_next/image fetch locally; verify images on Vercel, not localhost
- [EmailSubscriber table missing from prod DB](email-subscriber-table-missing.md) — all email capture 500s; fix SQL in docs/sql/; migrate diff hangs through pooler; local dev hits PROD DB (test leads to clean up)
- [Root loading.tsx soft-404](root-loading-tsx-soft-404.md) — root loading boundary made notFound() return 200; deleted it, don't reintroduce
