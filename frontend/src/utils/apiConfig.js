const defaultApiUrl = 'http://localhost:5000/api';
export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
export const SERVER_URL = API_URL.replace('/api', '');

/**
 * Centered helper to get full profile photo URL.
 * Handles Cloudinary URLs, local storage paths, and protocol upgrades.
 */
export const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath || typeof photoPath !== 'string') return null;
    const trimmedPath = photoPath.trim();
    if (!trimmedPath || trimmedPath === 'null' || trimmedPath === 'undefined' || trimmedPath === '') return null;

    // If it's already a full URL (Cloudinary)
    if (trimmedPath.startsWith('http')) {
        if (trimmedPath.includes('cloudinary.com') && trimmedPath.startsWith('http:')) {
            return trimmedPath.replace('http:', 'https:');
        }
        return trimmedPath;
    }

    // Standardize slashes early
    let cleanPath = trimmedPath.replace(/\\/g, '/');

    // If the path is just a filename (no directory prefix), assume it belongs in /uploads/
    if (!cleanPath.startsWith('/') && !cleanPath.includes('/')) {
        cleanPath = `uploads/${cleanPath}`;
    } else if (cleanPath.startsWith('/') && !cleanPath.substring(1).includes('/')) {
        cleanPath = `uploads${cleanPath}`;
    }

    // Ensure leading slash for concatenation
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

    // Construct full URL and clean up any double slashes (except the one in http://)
    const fullUrl = `${SERVER_URL}${finalPath}`.replace(/([^:])\/+/g, '$1/');

    return fullUrl;
};

if (import.meta.env.PROD) {
    console.log('[SmartHood] Production Mode Active');
    console.log('[SmartHood] API_URL:', API_URL);
    if (API_URL === defaultApiUrl) {
        console.warn('[SmartHood] WARNING: VITE_API_URL is missing! Requests will fail on Render.');
    }
}
