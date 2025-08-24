# JWT Authentication Setup Guide

This guide explains how to set up and use the JWT-based authentication system for the Tutor Homework Web App.

## Backend Setup

### 1. Install Dependencies

The backend now requires the `PyJWT` package. Install it by running:

```bash
cd hw_tracker_backend
pip install -r requirements.txt
```

### 2. Environment Variables

Update your `local.settings.json` to include the JWT secret:

```json
{
  "Values": {
    "JWT_SECRET": "your-super-secret-jwt-key-change-this-in-production"
  }
}
```

**Important**: Change the JWT_SECRET to a strong, unique key in production!

### 3. New Azure Functions

#### Auth Function (`/api/auth/{action}`)

- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login

#### Updated Homework Function

The existing homework function now requires JWT authentication. All requests must include the `Authorization: Bearer <token>` header.

### 4. Database Structure

The system automatically creates a `users` container in Cosmos DB with the following structure:

```json
{
  "id": "username",
  "username": "username",
  "passwordHash": "sha256_hash_of_password",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Frontend Setup

### 1. Authentication Flow

1. **Registration**: Users create accounts at `/register.html`
2. **Login**: Users sign in at `/login.html`
3. **JWT Storage**: Tokens are stored in `localStorage`
4. **Auto-redirect**: Authenticated users are redirected to dashboard
5. **Token Validation**: Tokens are validated on every API call

### 2. API Calls

All API calls now require authentication headers:

```javascript
const headers = getAuthHeaders();
// Returns: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' }

fetch('/api/homework', {
    method: 'GET',
    headers: getAuthHeaders()
});
```

### 3. Authentication Functions

The `auth.js` file provides these key functions:

- `loginUser(username, password)` - Authenticate user
- `registerUser(username, password)` - Create new account
- `logoutUser()` - Sign out and clear tokens
- `isAuthenticated()` - Check if user is logged in
- `requireAuth()` - Redirect to login if not authenticated
- `getAuthHeaders()` - Get headers for authenticated API calls

## Security Features

### 1. Password Hashing

- Passwords are hashed using SHA-256 before storage
- Never stored in plain text

### 2. JWT Tokens

- 24-hour expiration
- Signed with secret key
- Include username and timestamp
- Automatically validated on each request

### 3. Authentication Required

- All homework operations require valid JWT
- Unauthorized requests return 401 status
- Automatic token expiration checking

## Usage Examples

### Login Flow

```javascript
try {
    await loginUser('username', 'password');
    // User is now authenticated
    window.location.href = 'dashboard.html';
} catch (error) {
    console.error('Login failed:', error.message);
}
```

### Protected API Call

```javascript
async function fetchHomework() {
    try {
        const response = await fetch('/api/homework', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        return data;
    } catch (error) {
        if (error.status === 401) {
            // Token expired or invalid
            logoutUser();
        }
        throw error;
    }
}
```

### Check Authentication Status

```javascript
if (isAuthenticated()) {
    // User is logged in
    const username = getCurrentUsername();
    console.log(`Welcome, ${username}!`);
} else {
    // Redirect to login
    window.location.href = 'login.html';
}
```

## Deployment Notes

### Azure App Settings

When deploying to Azure, add these environment variables:

- `JWT_SECRET` - Your production JWT secret key
- `COSMOS_CONN_STRING` - Your Cosmos DB connection string
- `COSMOS_DB` - Your database name

### Production Security

1. **Change JWT_SECRET** - Use a strong, unique key
2. **HTTPS Only** - Ensure all communication is encrypted
3. **Token Expiration** - Consider reducing from 24 hours for production
4. **Rate Limiting** - Implement API rate limiting
5. **Input Validation** - Add server-side input validation

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if JWT token is valid and not expired
2. **CORS Errors**: Ensure backend CORS settings allow your frontend domain
3. **Token Storage**: Verify localStorage is available and working
4. **Database Connection**: Check Cosmos DB connection string and permissions

### Debug Mode

Enable console logging to debug authentication issues:

```javascript
// In browser console
localStorage.getItem('auth_token'); // Check stored token
localStorage.getItem('username');    // Check stored username
```

## Next Steps

1. **Password Reset**: Implement password reset functionality
2. **Email Verification**: Add email verification for new accounts
3. **Social Login**: Integrate with Google, Microsoft, or other providers
4. **Multi-factor Authentication**: Add 2FA for enhanced security
5. **Session Management**: Implement refresh tokens for longer sessions
