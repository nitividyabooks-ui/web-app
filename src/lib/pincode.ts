/**
 * Indian Pincode Lookup Utility
 * Auto-detects city and state from pincode
 */

export interface PincodeData {
    city: string;
    state: string;
    district: string;
}

/**
 * Fetches city/state from Indian pincode using India Post API
 * Falls back gracefully if API is unavailable
 */
export async function lookupPincode(pincode: string): Promise<PincodeData | null> {
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
        return null;
    }

    try {
        // Using India Post API (free, no auth required)
        const response = await fetch(
            `https://api.postalpincode.in/pincode/${pincode}`,
            { 
                next: { revalidate: 86400 }, // Cache for 24 hours
                signal: AbortSignal.timeout(5000) // 5 second timeout
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        if (
            !Array.isArray(data) || 
            data.length === 0 || 
            data[0].Status !== 'Success' ||
            !Array.isArray(data[0].PostOffice) ||
            data[0].PostOffice.length === 0
        ) {
            return null;
        }

        const postOffice = data[0].PostOffice[0];
        
        return {
            city: postOffice.Block || postOffice.Name || '',
            state: postOffice.State || '',
            district: postOffice.District || ''
        };
    } catch (error) {
        console.error('Pincode lookup failed:', error);
        return null;
    }
}

/**
 * Client-side pincode lookup (uses our API route to avoid CORS)
 */
export async function lookupPincodeClient(pincode: string): Promise<PincodeData | null> {
    if (!/^\d{6}$/.test(pincode)) {
        return null;
    }

    try {
        const response = await fetch(`/api/pincode/${pincode}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.success ? data.data : null;
    } catch {
        return null;
    }
}

/**
 * Validates if a pincode is deliverable
 * Can be extended to check against serviceable pincodes
 */
export function isDeliverablePincode(pincode: string): boolean {
    // For now, all valid Indian pincodes are deliverable
    // Can be extended to check against a list of serviceable pincodes
    return /^\d{6}$/.test(pincode);
}

/**
 * Format pincode with space for display (XXX XXX)
 */
export function formatPincode(pincode: string): string {
    const clean = pincode.replace(/\D/g, '');
    if (clean.length !== 6) return clean;
    return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}



