# 🔍 OAuth Debugging Guide

## Current Issue
OAuth authentication succeeds (Keycloak/Google), but after callback, you're redirected back to login page instead of onboarding.

## Root Cause Analysis

The OAuth flow is:
1. User clicks "Sign in with Keycloak/Google" ✅
2. Redirects to OAuth provider ✅
3. User authenticates ✅
4. OAuth provider redirects back to Cal.com ✅
5. **Cal.com processes callback and creates user** ❌ **POSSIBLE FAILURE POINT**
6. **Session is created** ❌ **POSSIBLE FAILURE POINT**
7. Redirect to onboarding ❌ **NOT HAPPENING**

## Debugging Steps

### Step 1: Check Server Logs

Run this command while testing login:

```bash
# Tail server logs and watch for OAuth activity
tail -f apps/web/.next/server/app.log 2>&1 | grep -E "OAuth|keycloak|google|signIn|JWT|Session"
```

Look for these messages:
- ✅ "OAuth JWT callback" - JWT callback was called
- ✅ "Keycloak signIn successful" - OAuth succeeded
- ✅ "getOnboardingRedirect called" - Redirect logic triggered
- ❌ "Error creating a new user" - User creation failed
- ❌ "callbacks:signIn - no matching provider" - Provider not recognized

### Step 2: Check Database for User

After OAuth login, check if user was created:

```bash
# Connect to your database
psql -U calcom_user -d calcom_db

# Check for users
SELECT id, email, name, "identityProvider", "identityProviderId", "completedOnboarding" 
FROM "User" 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

If no user is created, the issue is in the **signIn callback**.

### Step 3: Check Browser Console

1. Open login page
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Click "Sign in with Keycloak/Google"
5. Look for errors in console

Common errors:
- `POST /api/auth/callback/keycloak 500` - Server error
- `POST /api/auth/callback/google 500` - Server error
- `Failed to load resource` - Network issue

### Step 4: Test OAuth Callback Manually

Check if the callback endpoint is responding:

```bash
# This will fail but should show if endpoint exists
curl -X POST https://schedule.leadnest.ai/api/auth/callback/keycloak \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -v
```

Expected: Should return 302 redirect or error message
Not Expected: 404 Not Found (endpoint doesn't exist)

## Common Issues & Fixes

### Issue 1: User Creation Fails

**Symptoms:**
- OAuth succeeds
- No user in database
- Server logs show "Error creating a new user"

**Possible Causes:**
- Missing required fields (email, name)
- Email already exists with different provider
- Database constraint violation

**Fix:**
Check server logs for specific error. Common fixes:
```sql
-- Check for duplicate emails
SELECT email, "identityProvider" FROM "User" WHERE email = 'your-email@gmail.com';
```

### Issue 2: Session Not Created

**Symptoms:**
- User exists in database
- OAuth succeeds
- Session is null after callback
- Redirected back to login

**Possible Causes:**
- JWT secret mismatch
- Cookie domain issue
- NEXTAUTH_URL incorrect

**Fix:**
Verify `.env` settings:
```bash
NEXTAUTH_URL=https://schedule.leadnest.ai
NEXTAUTH_SECRET=1RJYFZVkhZswlzxHjkh+ZCdHBU8TxLze1tMVw0bPix4=
```

### Issue 3: Redirect Loop

**Symptoms:**
- OAuth succeeds
- User created
- Session created
- Redirected to login again

**Possible Causes:**
- Auto-redirect in getServerSideProps
- Callback URL mismatch

**Fix:**
The login page auto-redirects to Keycloak if `keycloakEnabled`. This can cause loops. Check if you're being caught in this flow.

## Quick Test: Check if OAuth Provider is Enabled

Run this in your browser console on the login page:

```javascript
// Check if Keycloak provider is loaded
fetch('/api/auth/providers')
  .then(r => r.json())
  .then(providers => {
    console.log('Available providers:', Object.keys(providers));
    console.log('Keycloak enabled:', !!providers.keycloak);
    console.log('Google enabled:', !!providers.google);
  });
```

Expected output:
```
Available providers: ['keycloak', 'google', 'credentials']
Keycloak enabled: true
Google enabled: true
```

If providers are missing, check:
1. Environment variables are set
2. Server was restarted after .env changes
3. No errors in server startup logs

## Expected Server Logs (Successful Flow)

```
[Keycloak provider is enabled] { clientId: 'schedule.leadnest', ... }
[Keycloak signIn callback] { hasUser: true, userEmail: 'user@example.com', ... }
[getOnboardingRedirect called] { userId: 123, provider: 'keycloak', ... }
[Redirecting to onboarding (not completed)] { userId: 123, redirectPath: '/getting-started' }
```

## What to Share for Help

If still stuck, share:
1. **Server logs** from OAuth attempt (tail -f output)
2. **Browser console** errors (F12 → Console)
3. **Database check** - does user exist?
4. **Network tab** - status codes from /api/auth/callback/* requests
