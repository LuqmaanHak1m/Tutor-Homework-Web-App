// Configuration file for Azure Function endpoints and Azure AD B2C
// Update this file with your actual Azure Function URLs and Azure AD B2C settings

const CONFIG = {
    // Replace with your actual Azure Function base URL
    API_BASE_URL: 'https://your-azure-function.azurewebsites.net/api',
    
    // Azure AD B2C Configuration
    AUTH: {
        // Replace with your actual Azure AD B2C tenant details
        TENANT_NAME: 'your-tenant-name',
        CLIENT_ID: 'your-client-id',
        POLICY_NAME: 'B2C_1_signupsignin', // Your B2C user flow name
        
        // Scopes for the application
        SCOPES: ['openid', 'profile', 'email'],
        
        // Redirect URI after successful authentication
        REDIRECT_URI: window.location.origin + '/dashboard.html',
        
        // Post logout redirect URI
        POST_LOGOUT_REDIRECT_URI: window.location.origin + '/index.html'
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