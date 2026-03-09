import axios from 'axios';

// Create a dedicated axios instance (optional, but good for future config)
// or just use global axios. For now, we'll use a direct function.

/**
 * Checks the current session status.
 * Returns the user object if authenticated, or null if guest/unauthenticated.
 * Suppresses 401 errors from the console/logs.
 */
export async function checkSession() {
    try {
        const { data } = await axios.get('/api/user_service/auth/validate', {
            withCredentials: true
        });

        // Ensure we don't return an error object as a user
        if (data && data.error) {
            return null;
        }

        return data; // Returns the user object
    } catch (error) {
        // If it's a 401, it just means not logged in (Guest). Return null safely.
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
            return null;
        }

        // For other errors (500, Network), we might want to know, but for session check
        // it's usually safer to just treat as logged out to avoid blocking UI.
        console.warn('Session check failed:', error.message);
        return null; // Fail safe to guest
    }
}
