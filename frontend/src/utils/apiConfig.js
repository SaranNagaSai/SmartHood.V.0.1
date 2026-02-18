const defaultApiUrl = 'http://localhost:5000/api';
export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
export const SERVER_URL = API_URL.replace('/api', '');

/**
 * Centered helper to get full profile photo URL.
 * Handles Cloudinary URLs, local storage paths, and protocol upgrades.
 */
export const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;

    // If it's already a full URL (Cloudinary)
    if (photoPath.startsWith('http')) {
        // Upgrade Cloudinary URLs to HTTPS to avoid mixed content on hosted sites
        if (photoPath.includes('cloudinary.com') && photoPath.startsWith('http:')) {
            return photoPath.replace('http:', 'https:');
        }
        return photoPath;
    }

    // Otherwise, it's a relative path from the server
    return `${SERVER_URL}${photoPath}`;
};

if (import.meta.env.PROD) {
    console.log('[SmartHood] Production Mode Active');
    console.log('[SmartHood] API_URL:', API_URL);
    if (API_URL === defaultApiUrl) {
        console.warn('[SmartHood] WARNING: VITE_API_URL is missing! Requests will fail on Render.');
    }
}
