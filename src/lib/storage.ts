const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function sanitizeEnvValue(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    // Defend against malformed `.env` where two lines got concatenated (missing newline),
    // e.g. `nitividyabooksNEXT_PUBLIC_GTM_ID=...`
    const cutMarkers = ["NEXT_PUBLIC_", "DATABASE_URL=", "GTM-", "="];
    for (const marker of cutMarkers) {
        const idx = raw.indexOf(marker);
        if (idx > 0) return raw.slice(0, idx).trim();
    }
    return raw.trim();
}

const BUCKET_NAME = sanitizeEnvValue(process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME) || "nitividyabooks";

if (!SUPABASE_URL) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is missing. Image URLs will be incorrect.");
}

export function getStorageUrl(path: string | null | undefined): string {
    if (!path) return "/images/placeholder-book.jpg"; // Fallback image
    if (path.startsWith("http")) return path; // Already a full URL

    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    const base = sanitizeEnvValue(SUPABASE_URL) || SUPABASE_URL;
    return `${base}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}
