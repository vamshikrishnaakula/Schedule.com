# Keycloak OAuth Callback Error - Fix

## Problem
After authenticating with Keycloak, you're being redirected back to:
```
```

This means the **Keycloak OAuth callback is failing**.

## Root Cause
The OAuth flow is breaking at one of these points:
1. **Redirect URI mismatch** - Keycloak doesn't recognize the callback URL
2. **PKCE/State validation failure** - Security tokens don't match
3. **Token exchange failure** - Can't exchange auth code for access token
4. **User info endpoint failure** - Can't fetch user profile

## Solution

### Step 1: Configure Keycloak Redirect URIs

In your **Keycloak Admin Console** at `https://auth.leadnest.ai`:

1. Go to **Clients** → Select your client (`schedule.leadnest`)
2. Go to **Settings** tab → **Access settings** section
3. Add these **Valid Redirect URIs**:
   ```
   https://schedule.leadnest.ai/api/auth/callback/keycloak
   https://schedule.leadnest.ai/*
   ```
4. Add these **Web Origins**:
   ```
   https://schedule.leadnest.ai
   +
   ```
5. Click **Save**

### Step 2: Verify Client Configuration

In Keycloak Admin Console, ensure these settings:

**Client Settings:**
- **Client ID**: `schedule.leadnest`
- **Name**: `Cal.com Schedule`
- **Description**: `Cal.com SSO for schedule.leadnest.ai`
- **Root URL**: `https://schedule.leadnest.ai`
- **Home URL**: `https://schedule.leadnest.ai`

**Access Settings:**
- **Client protocol**: `openid-connect`
- **Access Type**: `confidential`
- **Standard Flow Enabled**: `ON`
- **Direct Access Grants Enabled**: `ON`
- **Service Accounts Enabled**: `OFF`
- **Authorization Enabled**: `OFF`

**Login Settings:**
- **Require PKCE**: `ON` (recommended)
- **PKCE Code Challenge Method**: `S256`

**Fine grain OpenID Connect configuration:**
- **User Info Signed Response Algorithm**: `RS256`
- **Request Object Signature Algorithm**: `RS256`

### Step 3: Verify Environment Variables

Your `.env` and `ecosystem.config.js` should have:

```bash
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm
```

### Step 4: Test the OAuth Flow

1. **Restart your Cal.com app**:
   ```bash
   cd /home/ubuntu/cal.com
   pm2 restart calcom
   ```

2. **Clear browser cache and cookies** for `schedule.leadnest.ai`

3. **Go to** `https://schedule.leadnest.ai/`

4. **Click** "Sign in with Keycloak"

5. **Watch the URL** - you should see:
   ```
   https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth?
     client_id=schedule.leadnest&
     redirect_uri=https://schedule.leadnest.ai/api/auth/callback/keycloak&
     response_type=code&
     scope=openid+email+profile&
     state=...&
     code_challenge=...&
     code_challenge_method=S256
   ```

6. **Notice the `redirect_uri` parameter** - it should be exactly:
   ```
   https://schedule.leadnest.ai/api/auth/callback/keycloak
   ```

7. **Complete Keycloak login**

8. **You should be redirected back to** `https://schedule.leadnest.ai/` (not back to login with error)

### Step 5: Check Logs for Errors

After attempting login, check the logs:

```bash
# View recent errors
tail -100 /tmp/calcom-combined.log | grep -iE "keycloak|oauth|error"

# Watch logs in real-time
tail -f /tmp/calcom-combined.log | grep -iE "keycloak|oauth|error|callback"
```

Look for error messages like:
- `OAuthCallback error`
- `Keycloak OAuth callback failed`
- `redirect_uri mismatch`
- `PKCE validation failed`
- `Invalid token`

### Step 6: Test Keycloak Endpoints Manually

Test if your Keycloak is reachable and properly configured:

```bash
# Test well-known OIDC configuration
curl -s https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration | jq

# Should return JSON with endpoints like:
# - authorization_endpoint
# - token_endpoint
# - userinfo_endpoint
# - jwks_uri
```

### Step 7: Verify Client Secret

Make sure the client secret in your `.env` matches what's in Keycloak:

1. In Keycloak Admin Console, go to **Clients** → `schedule.leadnest` → **Credentials** tab
2. Copy the **Secret** value
3. Update your `.env`:
   ```bash
   KEYCLOAK_CLIENT_SECRET=<paste_secret_here>
   ```
4. Restart the app:
   ```bash
   pm2 restart calcom
   ```

## Common Issues

### Issue 1: "redirect_uri mismatch"
**Symptom**: Keycloak shows error page saying redirect URI is not allowed

**Fix**: Add the exact callback URL to Keycloak's Valid Redirect URIs:
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
```

### Issue 2: "Invalid client credentials"
**Symptom**: Token exchange fails

**Fix**: 
1. Verify `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET` match Keycloak
2. Regenerate client secret in Keycloak if needed
3. Restart Cal.com app after updating `.env`

### Issue 3: "PKCE validation failed"
**Symptom**: OAuth callback fails with state/PKCE error

**Fix**:
1. Ensure Keycloak client has **PKCE Code Challenge Method** set to `S256`
2. Make sure Cal.com is using PKCE (it should by default)

### Issue 4: "User info endpoint failure"
**Symptom**: Auth succeeds but can't fetch user profile

**Fix**:
1. In Keycloak, ensure the client has permission to access userinfo endpoint
2. Check that `openid email profile` scopes are requested

### Issue 5: "Email already exists with different provider"
**Symptom**: User exists in Cal.com database with different auth method

**Fix**:
1. Either delete the existing user and try again
2. Or enable `allowDangerousEmailAccountLinking` (already enabled in code)

## Quick Debug Command

Run this to see what's happening during OAuth:

```bash
# Start Cal.com in development mode to see detailed logs
cd /home/ubuntu/cal.com
yarn workspace @calcom/web dev

# Then try logging in with Keycloak and watch the console
```

## Expected Flow

1. User clicks "Sign in with Keycloak"
2. Redirected to: `https://schedule.leadnest.ai/api/auth/signin/keycloak`
3. Then to Keycloak: `https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth?...`
4. User logs in with Keycloak
5. Keycloak redirects back to: `https://schedule.leadnest.ai/api/auth/callback/keycloak?code=...&state=...`
6. Cal.com exchanges code for token
7. Cal.com fetches user info from Keycloak
8. User is logged in and redirected to homepage

## Still Not Working?

Enable debug logging by adding to your `.env`:

```bash
DEBUG=next-auth:*
LOG_LEVEL=debug
```

Then restart and check logs again:
```bash
pm2 restart calcom
tail -f /tmp/calcom-combined.log
```
