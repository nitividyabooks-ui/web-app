# next/font variables must be on <html>, not <body>

**Bug**: headings silently fell back to the body font even though
`--font-heading: var(--font-fraunces)` existed in `:root` and the
`.font-heading` utility was generated.

**Cause**: custom properties resolve `var()` references at the element where
they are *declared*, and descendants inherit the **resolved** value. next/font
puts `--font-fraunces` on the element you give the className to. With fonts on
`<body>`, the `:root` declaration `--font-heading: var(--font-fraunces)`
resolves at `<html>` where `--font-fraunces` is undefined → guaranteed-invalid
→ all descendants inherit an empty value. Any unlayered base rule like
`h1 { font-family: var(--font-heading) }` then beats the layered Tailwind
utility and renders the fallback font.

**Fix**: put next/font variable classes on `<html>`:
`<html className={`${fraunces.variable} ${nunitoSans.variable}`}>` (done in
`src/app/layout.tsx`). Keep font custom properties defined in `:root` in
`globals.css` so unlayered base rules resolve.

Also note: Tailwind 4 `@theme inline` does NOT emit custom properties at
runtime — plain-CSS `var(--font-heading)` references need a real `:root`
declaration in addition to the `@theme inline` entry.
