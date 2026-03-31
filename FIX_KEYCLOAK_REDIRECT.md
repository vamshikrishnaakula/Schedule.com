# Keycloak Redirect URI Fix

## Problem
You're being redirected to the wrong callback URL. This happens when Keycloak client configuration doesn't match Cal.com's expected callback URL.

## Solution

### 1. Configure Keycloak Client Correctly

In your Keycloak Admin Console (`https://auth.leadnest.ai`):

#### Step 1: Go to Client Settings
1. Select realm: `prod-leadnest-realm`
2. Go to **Clients**
3. Click on client: `schedule.leadnest`

#### Step 2: Set Access Settings
- **Client protocol**: `openid-connect`
- **Access type**: `confidential` (or `public` if testing)
- **Standard Flow Enabled**: `ON`
- **Direct Access Grants Enabled**: `ON`
- **Service Accounts Enabled**: `OFF`

#### Step 3: Configure Login Settings (CRITICAL)

**Valid redirect URIs** - Add ALL of these:
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
https://schedule.leadnest.ai/*
http://localhost:3000/api/auth/callback/keycloak
http://localhost:3000/*
```

**Valid post logout redirect URIs**:
```
https://schedule.leadnest.ai/*
http://localhost:3000/*
```

**Web origins**:
```
https://schedule.leadnest.ai
http://localhost:3000
+
```

#### Step 4: Configure Fine Grain OpenID Connect Configuration

Go to **Advanced settings** (or **Fine grain OpenID Connect configuration**):

- **Request URI Reuse**: `ON`
- **PKCE Code Challenge Method**: `S256`

#### Step 5: Verify Credentials
1. Go to **Credentials** tab
2. Copy the **Client secret**
3. Verify it matches your `.env`:
   ```
   KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
   ```

### 2. Verify Cal.com Configuration

Your `.env` should have:
```env
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm
NEXTAUTH_URL=https://schedule.leadnest.ai
NEXTAUTH_TRUST_HOST=true
```

### 3. Test the Flow

#### Test locally first:
1. Open: `http://localhost:3000/auth/login`
2. Click "Sign in with Keycloak"
3. You should be redirected to:
   ```
   https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth?
     client_id=schedule.leadnest&
     redirect_uri=http://localhost:3000/api/auth/callback/keycloak&
     ...
   ```
4. **Notice**: `redirect_uri` parameter should be `http://localhost:3000/api/auth/callback/keycloak`
5. Login with Keycloak
6. Should redirect back to `http://localhost:3000`

#### Test production:
1. Open: `https://schedule.leadnest.ai/`
2. Click "Sign in with Keycloak"
3. You should be redirected to:
   ```
   https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth?
     client_id=schedule.leadnest&
     redirect_uri=https://schedule.leadnest.ai/api/auth/callback/keycloak&
     ...
   ```
4. **Notice**: `redirect_uri` parameter should be `https://schedule.leadnest.ai/api/auth/callback/keycloak`

### 4. Common Errors and Fixes

#### Error: "Invalid redirect_uri"
**Cause**: Keycloak client doesn't have the redirect URI whitelisted

**Fix**: Add exact redirect URI to Keycloak client:
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
```

#### Error: "Invalid parameter: redirect_uri"
**Cause**: Mismatch between what Cal.com sends and what Keycloak expects

**Fix**: 
1. Check Keycloak client's **Valid redirect URIs** includes the exact URL
2. Make sure there are no trailing slashes
3. Use `/*` pattern for flexibility

#### Error: "Login failed - unable to query provider endpoint"
**Cause**: Keycloak issuer URL is incorrect or unreachable

**Fix**: Verify issuer URL:
```bash
curl -I https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration
```

Should return HTTP 200.

#### Error: "OAuthCallbackError: Code verification failed"
**Cause**: PKCE configuration mismatch

**Fix**: 
1. In Keycloak client settings, set **PKCE Code Challenge Method** to `S256`
2. Ensure `checks: ["pkce", "state"]` is in provider config (already done)

### 5. Debug Steps

#### Check what redirect URI Cal.com is using:
1. Click "Sign in with Keycloak"
2. Look at the URL in browser address bar
3. Find the `redirect_uri` parameter
4. It should be: `https://schedule.leadnest.ai/api/auth/callback/keycloak`

#### Check Keycloak logs:
1. In Keycloak Admin Console
2. Go to **Realm Settings** → **Admin Events**
3. Enable **Admin Events Settings** if not enabled
4. Check for errors

#### Check Cal.com logs:
```bash
tail -f /tmp/cal-com.log | grep -i keycloak
```

Look for errors like:
- `OAuthCallbackError`
- `redirect_uri_mismatch`
- `invalid_grant`

### 6. Quick Fix Script

If you need to quickly test, use this curl command to verify Keycloak is reachable:

```bash
# Test Keycloak OIDC endpoint
curl -s https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration | jq

# Should show:
# - authorization_endpoint
# - token_endpoint
# - userinfo_endpoint
```

### 7. Final Checklist

- [ ] Keycloak client has `https://schedule.leadnest.ai/api/auth/callback/keycloak` in redirect URIs
- [ ] Keycloak client has `https://schedule.leadnest.ai/*` as wildcard
- [ ] Client secret matches `.env` file
- [ ] Issuer URL is correct: `https://auth.leadnest.ai/realms/prod-leadnest-realm`
- [ ] PKCE is enabled with S256
- [ ] NEXTAUTH_URL is set to `https://schedule.leadnest.ai`
- [ ] Server restarted after config changes

## Still Having Issues?

Share the exact error message you're seeing and the redirect URL you're being sent to.
