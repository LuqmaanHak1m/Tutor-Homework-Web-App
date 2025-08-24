// Authentication utilities for JWT-based auth system

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    return token !== null && token !== undefined;
}

// Get current user's username
function getCurrentUsername() {
    return localStorage.getItem('username');
}

// Get auth headers for API calls
function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Login user
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Login failed');
        }
        
        const data = await response.json();
        
        // Store token and username
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('username', data.username);
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Register user
async function registerUser(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Registration failed');
        }
        
        const data = await response.json();
        
        // Store token and username
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('username', data.username);
        
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// Check if token is expired
function isTokenExpired() {
    const token = localStorage.getItem('auth_token');
    if (!token) return true;
    
    try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        
        return now >= exp;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
}

// Auto-logout if token is expired
function checkTokenExpiration() {
    if (isTokenExpired()) {
        alert('Your session has expired. Please log in again.');
        logoutUser();
    }
}

// Initialize auth check on page load
function initAuthCheck() {
    // Check token expiration every minute
    setInterval(checkTokenExpiration, 60000);
    
    // Check immediately on page load
    checkTokenExpiration();
}

// Auto-login if token is expired
function checkToken() {
    if (!isTokenExpired()) {
        window.location.href = 'dashboard.html';
    }
}

// Initialize auth check on page load
function initLoginAuthCheck() {
    // Check immediately on page load
    checkToken();
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect to dashboard if already authenticated
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
} 