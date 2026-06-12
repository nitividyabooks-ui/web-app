// Fails if any emoji glyph appears in consumer-facing source files.
// Admin pages are excluded (out of redesign scope).
// Usage: node scripts/check-no-emoji.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const EXCLUDED_DIRS = [join(SRC, "app", "admin"), join(SRC, "components", "admin")];
// WhatsApp/email message templates are messaging content, not website UI.
const EXCLUDED_FILES = [
    join(SRC, "lib", "whatsapp.ts"),
    join(SRC, "lib", "whatsapp-notifications.ts"),
    join(SRC, "lib", "email-notifications.ts"),
];
const EXTENSIONS = [".ts", ".tsx", ".css"];

// Emoji ranges: pictographs, symbols, transport, flags, dingbats, variation selectors on symbols
const EMOJI_RE =
    /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function walk(dir, files = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (EXCLUDED_DIRS.some((ex) => full.startsWith(ex))) continue;
        if (statSync(full).isDirectory()) walk(full, files);
        else if (EXTENSIONS.some((ext) => full.endsWith(ext)) && !EXCLUDED_FILES.includes(full)) files.push(full);
    }
    return files;
}

const violations = [];
for (const file of walk(SRC)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
        const match = line.match(EMOJI_RE);
        if (match) violations.push(`${relative(ROOT, file)}:${i + 1}  ${match[0]}`);
    });
}

if (violations.length > 0) {
    console.error(`Emoji found in ${violations.length} place(s) — not allowed in consumer UI:\n`);
    for (const v of violations) console.error("  " + v);
    process.exit(1);
}
console.log("No emojis found in consumer-facing source.");
