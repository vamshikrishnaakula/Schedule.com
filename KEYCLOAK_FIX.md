# Keycloak OAuthCallback Error - FIXED

## Problem
After authenticating with Keycloak, users were redirected back to login with `error=OAuthCallback`

## Root Cause
NextAuth v4 requires the `wellKnown` URL for OIDC discovery. The error message was:
```
jwks_uri must be configured on the issuer
```

## Solution Applied

### Updated Keycloak Provider Configuration

Changed from:
```typescript
issuer: process.env.KEYCLOAK_ISSUER
```

To:
```typescript
wellKnown: `${process.env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`,
jwks_uri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
httpOptions: {
  timeout: 10000,
}
```

### What This Fixes

1. **wellKnown URL**: Points NextAuth to the OIDC discovery document
2. **jwks_uri**: Explicitly sets the JWKS endpoint for token verification
3. **httpOptions**: Adds timeout to prevent fetch failures

## Test Now

1. Go to: https://schedule.leadnest.ai/auth/login
2. Click "Sign in with Keycloak"
3. Enter Keycloak credentials
4. Should redirect to: https://schedule.leadnest.ai/ (logged in)

## Keycloak Configuration Checklist

In Keycloak Admin Console:

### 1. Client Settings
- Client ID: `schedule.leadnest`
- Client Protocol: `openid-connect`
- Access Type: `confidential`

### 2. Valid Redirect URIs
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
https://schedule.leadnest.ai/*
```

### 3. Valid Post Logout Redirect URIs
```
https://schedule.leadnest.ai/*
```

### 4. Web Origins
```
https://schedule.leadnest.ai
+
```

### 5. Keys Configuration
- Go to: Realm Settings → Keys
- Make sure RSA keys are active
- JWKS endpoint should be accessible: 
  ```
  curl https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/certs
  ```

## Verify OIDC Discovery

Test these URLs:

1. **Well-Known URL**:
   ```bash
   curl https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration
   ```
   Should return JSON with `issuer`, `jwks_uri`, `authorization_endpoint`, etc.

2. **JWKS Endpoint**:
   ```bash
   curl https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/certs
   ```
   Should return JSON with `keys` array containing RSA public keys.

## Troubleshooting

### Still Getting OAuthCallback Error?

Check server logs:
```bash
tail -100 /tmp/cal-com.log | grep -i keycloak
```

Common issues:

1. **Network Issue**: Server can't reach Keycloak
   ```bash
   curl -I https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration
   ```

2. **Redirect URI Mismatch**: Check Keycloak client settings
   - Make sure `https://schedule.leadnest.ai/api/auth/callback/keycloak` is in Valid Redirect URIs

3. **Client Secret Wrong**: Verify in Keycloak
   - Go to: Clients → schedule.leadnest → Credentials
   - Copy secret and update `.env`:
     ```
     KEYCLOAK_CLIENT_SECRET=<paste_from_keycloak>
     ```

4. **SSL/Certificate Issue**: If using self-signed certs
   - Add to `.env`:
     ```
     NODE_TLS_REJECT_UNAUTHORIZED=0
     ```
   - Rebuild and restart

### Check Server Logs

```bash
# Real-time logs
tail -f /tmp/cal-com.log | grep -iE "keycloak|oauth|error"

# Last 100 lines
tail -100 /tmp/cal-com.log | grep -iE "keycloak|oauth|error"
```

## Expected Flow

1. User clicks "Sign in with Keycloak"
2. Redirected to: `https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth`
3. User enters credentials
4. Keycloak redirects to: `https://schedule.leadnest.ai/api/auth/callback/keycloak?code=...`
5. NextAuth exchanges code for tokens
6. User redirected to: `https://schedule.leadnest.ai/` (logged in)

## Success Indicators

- ✅ No OAuthCallback error
- ✅ Redirected to homepage after Keycloak login
- ✅ User created in Cal.com database
- ✅ Server logs show successful authentication
