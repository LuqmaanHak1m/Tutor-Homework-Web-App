// MSAL.js Authentication Module for Azure AD B2C
let msalInstance = null;
let currentAccount = null;

// Initialize MSAL instance
function initializeMSAL() {
    const msalConfig = {
        auth: {
            clientId: CONFIG.AUTH.CLIENT_ID,
            authority: `https://${CONFIG.AUTH.TENANT_NAME}.b2clogin.com/${CONFIG.AUTH.TENANT_NAME}.onmicrosoft.com/${CONFIG.AUTH.POLICY_NAME}`,
            knownAuthorities: [`${CONFIG.AUTH.TENANT_NAME}.b2clogin.com`],
            redirectUri: CONFIG.AUTH.REDIRECT_URI,
            postLogoutRedirectUri: CONFIG.AUTH.POST_LOGOUT_REDIRECT_URI,
            navigateToLoginRequestUrl: false
        },
        cache: {
            cacheLocation: 'sessionStorage',
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {
                    if (containsPii) {
                        return;
                    }
                    switch (level) {
                        case 0: // Error
                            console.error(message);
                            break;
                        case 1: // Warning
                            console.warn(message);
                            break;
                        case 2: // Info
                            console.info(message);
                            break;
                        case 3: // Verbose
                            console.debug(message);
                            break;
                    }
                }
            }
        }
    };

    try {
        msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Handle redirect response
        msalInstance.handleRedirectPromise().then(handleAuthResponse).catch(error => {
            console.error('Error handling redirect:', error);
        });
        
        // Set up account
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            updateUI();
        }
        
    } catch (error) {
        console.error('Error initializing MSAL:', error);
        showAuthError('Failed to initialize authentication');
    }
}

// Handle authentication response
function handleAuthResponse(response) {
    if (response) {
        if (response.account) {
            currentAccount = response.account;
            console.log('User signed in successfully:', currentAccount);
            
            // Store user info in localStorage for dashboard access
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userAccount', JSON.stringify(currentAccount));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }
}

// Sign in function
async function signIn() {
    if (!msalInstance) {
        showAuthError('Authentication not initialized');
        return;
    }

    try {
        const loginRequest = {
            scopes: CONFIG.AUTH.SCOPES,
            prompt: 'select_account'
        };

        await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
        console.error('Error during sign in:', error);
        showAuthError('Sign in failed. Please try again.');
    }
}

// Sign out function
async function signOut() {
    if (!msalInstance || !currentAccount) {
        return;
    }

    try {
        const logoutRequest = {
            account: currentAccount,
            postLogoutRedirectUri: CONFIG.AUTH.POST_LOGOUT_REDIRECT_URI
        };

        await msalInstance.logoutRedirect(logoutRequest);
    } catch (error) {
        console.error('Error during sign out:', error);
        showAuthError('Sign out failed. Please try again.');
    }
}

// Update UI based on authentication state
function updateUI() {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userInfo = document.getElementById('userInfo');
    const authStatus = document.getElementById('authStatus');

    if (currentAccount) {
        // User is signed in
        signInButton.style.display = 'none';
        signOutButton.style.display = 'inline-block';
        userInfo.style.display = 'flex';
        
        // Update user info display
        displayUserInfo(currentAccount);
        
        // Update auth status
        authStatus.innerHTML = '<p>You are signed in. Redirecting to dashboard...</p>';
        
        // Auto-redirect after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } else {
        // User is not signed in
        signInButton.style.display = 'inline-block';
        signOutButton.style.display = 'none';
        userInfo.style.display = 'none';
        authStatus.innerHTML = '<p>Please sign in to access your homework dashboard.</p>';
    }
}

// Display user information
function displayUserInfo(account) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userInitials');

    // Set user name
    if (account.name) {
        userName.textContent = account.name;
    } else if (account.username) {
        userName.textContent = account.username;
    } else {
        userName.textContent = 'User';
    }

    // Set user email
    if (account.username) {
        userEmail.textContent = account.username;
    } else {
        userEmail.textContent = 'No email available';
    }

    // Handle user avatar/initials
    if (account.name) {
        const initials = account.name.split(' ').map(n => n[0]).join('').toUpperCase();
        userInitials.textContent = initials;
        userInitials.style.display = 'block';
        userAvatar.style.display = 'none';
    } else {
        userInitials.style.display = 'none';
        userAvatar.style.display = 'none';
    }
}

// Show authentication error
function showAuthError(message) {
    const authStatus = document.getElementById('authStatus');
    authStatus.innerHTML = `<p class="auth-error">${message}</p>`;
}

// Get access token for API calls
async function getAccessToken() {
    if (!msalInstance || !currentAccount) {
        throw new Error('No authenticated user');
    }

    try {
        const request = {
            scopes: CONFIG.AUTH.SCOPES,
            account: currentAccount
        };

        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.error('Error acquiring token silently:', error);
        
        // Try interactive token acquisition
        try {
            const response = await msalInstance.acquireTokenRedirect(request);
            return response.accessToken;
        } catch (interactiveError) {
            console.error('Error acquiring token interactively:', interactiveError);
            throw new Error('Failed to acquire access token');
        }
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return currentAccount !== null;
}

// Get current user account
function getCurrentAccount() {
    return currentAccount;
}

// Initialize authentication when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMSAL();
}); 