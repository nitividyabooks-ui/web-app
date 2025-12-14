const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME || "nitividyabooks";

if (!SUPABASE_URL) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is missing. Image URLs will be incorrect.");
}

export function getStorageUrl(path: string | null | undefined): string {
    if (!path) return "/images/placeholder-book.jpg"; // Fallback image
    if (path.startsWith("http")) return path; // Already a full URL

    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}
