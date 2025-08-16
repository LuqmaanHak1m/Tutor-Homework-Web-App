# Azure AD B2C Setup Guide for Homework Tracker App

This guide will help you set up Azure AD B2C authentication for your homework tracker application.

## Prerequisites

- Azure subscription
- Access to Azure Portal
- Basic understanding of Azure AD B2C

## Step 1: Create Azure AD B2C Tenant

1. **Sign in to Azure Portal** at https://portal.azure.com
2. **Search for "Azure AD B2C"** in the search bar
3. **Click "Create"** to create a new B2C tenant
4. **Fill in the required information:**
   - Organization name: Your organization name
   - Initial domain name: Choose a unique domain (e.g., `yourorg.onmicrosoft.com`)
   - Country/Region: Select your region
   - Resource group: Create new or use existing
5. **Click "Review + create"** and then **"Create"**

## Step 2: Register Your Application

1. **Go to your B2C tenant** in Azure Portal
2. **Navigate to "App registrations"** → **"New registration"**
3. **Fill in the application details:**
   - Name: "Homework Tracker App"
   - Supported account types: "Accounts in any identity provider or organizational directory"
   - Redirect URI: 
     - Type: "Single-page application (SPA)"
     - URI: `https://yourdomain.com/dashboard.html` (replace with your actual domain)
4. **Click "Register"**
5. **Copy the Application (client) ID** - you'll need this for the config

## Step 3: Configure User Flows

1. **Go to "User flows"** in your B2C tenant
2. **Click "New user flow"**
3. **Select "Sign up and sign in"** → **"Create"**
4. **Configure the user flow:**
   - Name: `B2C_1_signupsignin`
   - Identity providers: Select "Email signup" and "Microsoft Account"
   - User attributes and claims: Select the attributes you want to collect
     - Recommended: Given name, Surname, Email Address
5. **Click "Create"**

## Step 4: Update Configuration Files

1. **Update `config.js`:**
   ```javascript
   const CONFIG = {
       // Azure AD B2C Configuration
       AUTH: {
           TENANT_NAME: 'your-tenant-name', // e.g., 'myorg'
           CLIENT_ID: 'your-client-id', // From step 2
           POLICY_NAME: 'B2C_1_signupsignin', // From step 3
           SCOPES: ['openid', 'profile', 'email'],
           REDIRECT_URI: 'https://yourdomain.com/dashboard.html',
           POST_LOGOUT_REDIRECT_URI: 'https://yourdomain.com/index.html'
       },
       // ... rest of config
   };
   ```

2. **Update redirect URIs in Azure Portal:**
   - Go to your app registration → "Authentication"
   - Add these redirect URIs:
     - `https://yourdomain.com/dashboard.html`
     - `https://yourdomain.com/login.html`
     - `https://yourdomain.com/tutor.html`

## Step 5: Test Authentication

1. **Open your application** in a browser
2. **Click "Sign In with Microsoft"**
3. **Complete the sign-up/sign-in process**
4. **Verify you're redirected to the dashboard**
5. **Check that user information is displayed**

## Step 6: Configure CORS (if needed)

If you encounter CORS issues:

1. **Go to your app registration** → "Authentication"
2. **Add your domain to "Frontend logout URL"**
3. **Configure CORS in your Azure Functions** if applicable

## Troubleshooting

### Common Issues:

1. **"AADB2C90006: The application is not configured as a multi-tenant application"**
   - Solution: Ensure "Accounts in any identity provider" is selected

2. **"AADB2C90091: The user flow 'B2C_1_signupsignin' is not found"**
   - Solution: Verify the policy name matches exactly

3. **Redirect URI mismatch**
   - Solution: Ensure redirect URIs in config match those in Azure Portal

4. **CORS errors**
   - Solution: Add your domain to allowed origins in Azure Functions

### Debug Tips:

1. **Check browser console** for detailed error messages
2. **Verify tenant name** is correct (without `.onmicrosoft.com`)
3. **Ensure client ID** is copied correctly from app registration
4. **Check network tab** for failed requests

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **Token Validation**: Validate tokens on your backend
3. **Scope Limitation**: Only request necessary scopes
4. **Error Handling**: Don't expose sensitive information in error messages

## Next Steps

1. **Customize user flows** for your specific needs
2. **Add social identity providers** (Google, Facebook, etc.)
3. **Implement role-based access control**
4. **Add multi-factor authentication**
5. **Set up user management** and monitoring

## Support Resources

- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Azure AD B2C Samples](https://github.com/Azure-Samples/active-directory-b2c-javascript-msal-singlepageapp)

## Configuration Summary

After setup, your `config.js` should look like this:

```javascript
const CONFIG = {
    AUTH: {
        TENANT_NAME: 'myorg', // Your tenant name
        CLIENT_ID: '12345678-1234-1234-1234-123456789012', // Your app ID
        POLICY_NAME: 'B2C_1_signupsignin',
        SCOPES: ['openid', 'profile', 'email'],
        REDIRECT_URI: 'https://yourdomain.com/dashboard.html',
        POST_LOGOUT_REDIRECT_URI: 'https://yourdomain.com/index.html'
    },
    // ... rest of your configuration
};
```

Your application is now ready to use Azure AD B2C authentication! 🎉 