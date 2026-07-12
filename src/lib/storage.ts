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

// Upload buffer to Supabase Storage via REST API (no SDK needed)
export async function uploadToSupabase(
    buffer: Uint8Array | Buffer,
    path: string,
    mimeType: string
): Promise<string> {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": mimeType,
        },
        body: new Uint8Array(buffer),
    });
    if (!res.ok) throw new Error(`Supabase upload failed: ${res.status}`);
    return getStorageUrl(path);
}

export function getStorageUrl(path: string | null | undefined): string {
    // Handle null, undefined, empty string, or invalid values
    if (!path || typeof path !== "string" || path.trim() === "") {
        return "/images/placeholder-book.svg"; // Fallback image
    }
    
    const pathString = path.trim();
    
    if (pathString.startsWith("http")) return pathString; // Already a full URL

    // Remove leading slash if present
    const cleanPath = pathString.startsWith("/") ? pathString.slice(1) : pathString;

    const base = sanitizeEnvValue(SUPABASE_URL) || SUPABASE_URL;
    return `${base}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}
