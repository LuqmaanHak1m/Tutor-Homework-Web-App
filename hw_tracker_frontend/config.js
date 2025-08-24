// Configuration file for Azure Function endpoints and JWT authentication
// Update this file with your actual Azure Function URLs

const API_BASE = "http://localhost:7071/api"; // or your deployed URL
const DEFAULT_CHILD_ID = "alex";

const CONFIG = {
    // Replace with your actual Azure Function base URL
    API_BASE_URL: 'https://hwtracker-func-001-hpaddmbaasfxhyg0.uksouth-01.azurewebsites.net/api',
    
    // JWT Authentication Configuration
    AUTH: {
        // JWT token storage key
        TOKEN_KEY: 'auth_token',
        USERNAME_KEY: 'username',
        
        // Auth endpoints
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        
        // Token expiration check (24 hours)
        TOKEN_EXPIRY_HOURS: 24
    },
    
    // API endpoints
    ENDPOINTS: {
        HOMEWORK: '/homework',
        HOMEWORK_COMPLETE: '/homework/{id}/complete'
    },
    
    // API settings
    API_TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    
    // Feature flags
    ENABLE_API_STATUS_CHECK: true,
    ENABLE_ERROR_NOTIFICATIONS: true,
    ENABLE_LOADING_STATES: true,
    ENABLE_AUTH: true
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 