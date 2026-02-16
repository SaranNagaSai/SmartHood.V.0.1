const defaultApiUrl = 'http://localhost:5000/api';
export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
export const SERVER_URL = API_URL.replace('/api', '');

if (import.meta.env.PROD) {
    console.log('[SmartHood] Production Mode Active');
    console.log('[SmartHood] API_URL:', API_URL);
    if (API_URL === defaultApiUrl) {
        console.warn('[SmartHood] WARNING: VITE_API_URL is missing! Requests will fail on Render.');
    }
}
