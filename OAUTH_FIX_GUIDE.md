# 🔧 OAuth Login Fix Guide

## Problem Summary
1. **Keycloak**: "Keycloak callback failed" - redirect URI mismatch
2. **Google**: Redirect loop after selecting account

---

## ✅ FIX 1: Keycloak Redirect URI (CRITICAL)

### The Problem
Your Keycloak redirect URI is configured as:
```
https://schedule.leadnest.ai/app/auth/callback/keycloak  ❌ WRONG
```

But Cal.com expects:
```
https://schedule.leadnest.ai/api/auth/callback/keycloak  ✅ CORRECT
```

### How to Fix

#### Step 1: Login to Keycloak Admin
URL: https://auth.leadnest.ai/admin/

#### Step 2: Navigate to Client Settings
1. Select realm: **prod-leadnest-realm**
2. Go to **Clients** in left menu
3. Click on **schedule.leadnest**

#### Step 3: Update Redirect URI
1. Scroll to **Valid redirect URIs** section
2. **Edit the URI**:
   - FROM: `https://schedule.leadnest.ai/app/auth/callback/keycloak`
   - TO: `https://schedule.leadnest.ai/api/auth/callback/keycloak`
3. Click **Save**

#### Step 4: Verify Configuration
Your redirect URIs should look like:
```
Valid redirect URIs:
  ✓ https://schedule.leadnest.ai/api/auth/callback/keycloak
  ✓ https://schedule.leadnest.ai/*
```

---

## ✅ FIX 2: Google OAuth Redirect Loop

### The Problem
After selecting Google account, you're redirected back to login page instead of proceeding to onboarding.

### Root Cause
The OAuth callback is failing silently, likely due to:
1. Missing user in database
2. Email verification issue
3. Session not being created

### Solution

#### Option A: Check Google Cloud Console Configuration

1. Go to: https://console.cloud.google.com/
2. Select project: **scheduley-484607**
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Check **Authorized redirect URIs**:
   ```
   ✓ https://schedule.leadnest.ai/api/auth/callback/google
   ✓ https://schedule.leadnest.ai/api/integrations/google/callback
   ✓ https://schedule.leadnest.ai/api/integrations/googlecalendar/callback
   ```

#### Option B: Check User Email Verification

The Google account email must be verified. Check:
1. Login with Google
2. Check if the email has a verified badge in Google

#### Option C: Clear Browser Data

Sometimes cookies cause issues:
```bash
# In Chrome/Edge:
1. Press Ctrl+Shift+Delete
2. Select "Cookies and other site data"
3. Select "Cached images and files"
4. Click "Clear data"
5. Restart browser
```

#### Option D: Check Server Logs

Run this to see what's happening:
```bash
# Tail server logs and filter for OAuth
tail -f apps/web/.next/server/app.log 2>&1 | grep -i "oauth\|google\|keycloak"
```

Look for errors like:
- `OAuthCallback error`
- `Email not verified`
- `User creation failed`

---

## 🧪 Testing After Fixes

### Test Keycloak Login

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to: https://schedule.leadnest.ai/
3. Click **"Sign in with Keycloak"**
4. Login with Keycloak credentials
5. **Expected**: Redirect to `/getting-started/user-settings`

### Test Google Login

1. Clear browser cache
2. Go to: https://schedule.leadnest.ai/
3. Click **"Sign in with Google"**
4. Select Google account
5. **Expected**: Redirect to `/getting-started/user-settings`

---

## 🐛 Debugging Checklist

### If Still Getting Keycloak Error:

- [ ] Verify redirect URI in Keycloak is EXACTLY: `/api/auth/callback/keycloak`
- [ ] Check for trailing slashes (should NOT have `/` at end)
- [ ] Verify Keycloak client secret matches `.env`
- [ ] Check Keycloak server logs for errors

### If Still Getting Google Redirect Loop:

- [ ] Verify Google Cloud redirect URIs match exactly
- [ ] Check if user email is verified in Google
- [ ] Check NEXTAUTH_URL in `.env` matches domain
- [ ] Check NEXTAUTH_SECRET is set correctly
- [ ] Look for errors in browser console (F12)
- [ ] Check server logs for OAuth errors

---

## 📋 Required Environment Variables

Verify these are set in `.env`:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://schedule.leadnest.ai
NEXTAUTH_SECRET=1RJYFZVkhZswlzxHjkh+ZCdHBU8TxLze1tMVw0bPix4=

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm

# Google Configuration
GOOGLE_LOGIN_ENABLED=true
GOOGLE_API_CREDENTIALS={"web":{"client_id":"778638370742-rtc4oro1k5m8htlvsjc9otq8qnisri7e.apps.googleusercontent.com","client_secret":"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","redirect_uris":["https://schedule.leadnest.ai/api/auth/callback/google"]}}
```

---

##  Expected Flow After Fix

### New User (First Login)
1. Login with Keycloak/Google
2. OAuth provider authenticates user
3. Cal.com creates user account
4. **Redirect to**: `/getting-started/user-settings`
5. Complete onboarding steps:
   - User Settings
   - Connected Calendar
   - Connected Video
   - Setup Availability
   - User Profile
6. **Final destination**: `/event-types`

### Returning User (Onboarding Complete)
1. Login with Keycloak/Google
2. OAuth provider authenticates user
3. **Redirect to**: `/event-types`

---

## 📞 Still Having Issues?

Share these details:
1. Screenshot of Keycloak **Valid redirect URIs** configuration
2. Server log output when trying to login
3. Browser console errors (F12 → Console tab)
4. Which OAuth provider is failing (Keycloak, Google, or both)
