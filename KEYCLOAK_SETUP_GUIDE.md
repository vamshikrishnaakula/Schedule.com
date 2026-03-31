# Keycloak Configuration Guide for Cal.com

## Problem Fixed
The `OAuthSignin` error was caused by a duplicate Keycloak provider configuration in `[...nextauth].ts` that was conflicting with the main configuration in `next-auth-options.ts`.

## Changes Made

### 1. Removed Duplicate Provider Configuration
**File**: `apps/web/pages/api/auth/[...nextauth].ts`
- Removed the `extraProviders` array that was duplicating the Keycloak configuration
- Now uses the single source of truth from `next-auth-options.ts`

### 2. Improved Keycloak Provider Configuration
**File**: `packages/features/auth/lib/next-auth-options.ts`
- Removed dependency on `wellKnown` URL discovery (which was failing)
- Using explicit OAuth endpoints for better reliability
- Added comprehensive logging for debugging
- Increased timeout to 15 seconds for slower Keycloak servers

### 3. Enhanced Error Messages
**File**: `apps/web/modules/auth/login-view.tsx`
- Added better error messages for different OAuth failure scenarios
- Added console.error logging for server-side debugging
- Added handling for `OAuthCallback` errors

## Keycloak Server Configuration

### 1. Create a New Client in Keycloak

1. Login to your Keycloak admin console: https://auth.leadnest.ai
2. Navigate to your realm: `prod-leadnest-realm`
3. Go to **Clients** → **Create client**
4. Configure the client:
   - **Client ID**: `schedule.leadnest`
   - **Client Type**: OpenID Connect
   - Click **Next**

### 2. Client Settings

**Capability config:**
- ✅ Authorization: **OFF**
- ✅ Client authentication: **ON**
- ✅ Standard flow: **ON**
- ✅ Direct access grants: **ON** (optional, for API access)

Click **Next**

### 3. Login Settings

**Root URL**: `https://schedule.leadnest.ai`
**Home URL**: `https://schedule.leadnest.ai`

**Valid redirect URIs:**
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
http://localhost:3000/api/auth/callback/keycloak  (for local development)
```

**Valid post logout redirect URIs:**
```
https://schedule.leadnest.ai
http://localhost:3000
```

**Web origins:**
```
https://schedule.leadnest.ai
http://localhost:3000
```

Click **Save**

### 4. Client Credentials

1. Go to the **Credentials** tab
2. Copy the **Client secret**
3. Update your `.env` file:
   ```bash
   KEYCLOAK_CLIENT_SECRET=<paste-your-client-secret-here>
   ```

### 5. Client Scopes (Optional but Recommended)

1. Go to **Client scopes** tab
2. Add the following scopes if not already present:
   - `openid`
   - `email`
   - `profile`

3. For the `email` scope:
   - Make sure `email` and `email_verified` are in the token claims

4. For the `profile` scope:
   - Ensure these claims are available: `name`, `given_name`, `family_name`, `preferred_username`, `picture`

### 6. Mappers Configuration (If Needed)

If your users don't have all required fields, configure mappers:

1. Go to **Client scopes** → `profile` → **Mappers**
2. Add mappers for:
   - `name`: Map to `name` claim
   - `givenName`: Map to `given_name` claim
   - `familyName`: Map to `family_name` claim
   - `username`: Map to `preferred_username` claim
   - `picture`: Map to `picture` claim (if using avatars)

## Environment Variables

Ensure these are set in your `.env` file:

```bash
# Keycloak OAuth Configuration
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=<your-client-secret-from-keycloak>
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm

# Optional: Custom well-known URL (if different from standard)
# KEYCLOAK_WELL_KNOWN_URL=https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration

# Required for production
NEXTAUTH_URL=https://schedule.leadnest.ai
NEXTAUTH_SECRET=<your-nextauth-secret>

# Optional: Allow self-signed certificates (development only)
# NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Testing the Configuration

### 1. Check Server Logs

After restarting your Cal.com server, you should see:
```
[Keycloak provider is enabled] {
  clientId: 'schedule.leadnest',
  issuer: 'https://auth.leadnest.ai/realms/prod-leadnest-realm'
}
```

If you see:
```
[Keycloak provider is NOT enabled - missing environment variables]
```

Then check your `.env` file and ensure all variables are set correctly.

### 2. Test Login Flow

1. Navigate to: `https://schedule.leadnest.ai/`
2. Click **"Sign in with Keycloak"**
3. You should be redirected to Keycloak login page
4. After successful authentication, you'll be redirected back to Cal.com

### 3. Common Errors and Solutions

#### Error: `OAuthSignin`
**Cause**: NextAuth cannot initiate the OAuth flow
**Solutions**:
- Check that Keycloak server is accessible from your Cal.com server
- Verify `KEYCLOAK_ISSUER` URL is correct (no trailing slash)
- Check server logs for connection errors
- Ensure firewall allows outbound HTTPS to Keycloak

#### Error: `OAuthCallback`
**Cause**: Redirect URI mismatch
**Solutions**:
- Verify the redirect URI in Keycloak matches exactly:
  `https://schedule.leadnest.ai/api/auth/callback/keycloak`
- Check for http vs https mismatch
- Ensure no trailing slashes in redirect URIs

#### Error: `keycloak-missing-email`
**Cause**: Keycloak didn't return an email in the profile
**Solutions**:
- Check that users have verified emails in Keycloak
- Ensure `email` scope is included in the authorization request
- Verify email mapper is configured in Keycloak

#### Error: Certificate/SSL Issues
**Cause**: Self-signed certificates in Keycloak
**Solutions**:
- For development: Set `NODE_TLS_REJECT_UNAUTHORIZED=0` in `.env`
- For production: Use valid SSL certificates

### 4. Debug Mode

To enable detailed logging, set:
```bash
NEXT_PUBLIC_LOGGER_LEVEL=2  # Debug level
```

Then check your server logs for detailed OAuth flow information.

## Onboarding Flow After Login

After successful Keycloak authentication, users will be redirected to:

1. **New users** (haven't completed onboarding):
   - `/getting-started/user-settings`
   - `/getting-started/connected-calendar`
   - `/getting-started/connected-video`
   - `/getting-started/setup-availability`
   - `/getting-started/user-profile`

2. **Returning users** (completed onboarding):
   - `/event-types`

## Troubleshooting Checklist

- [ ] Keycloak server is running and accessible
- [ ] Client ID matches in both Keycloak and `.env`
- [ ] Client secret is correct
- [ ] Issuer URL is correct (no trailing slash)
- [ ] Redirect URI is configured in Keycloak
- [ ] User has verified email in Keycloak
- [ ] Required scopes are configured (openid, email, profile)
- [ ] Server logs show "Keycloak provider is enabled"
- [ ] No firewall blocking communication between Cal.com and Keycloak

## Support

If you're still experiencing issues:

1. Check the browser console for JavaScript errors
2. Check the Cal.com server logs for OAuth errors
3. Check Keycloak server logs for authentication errors
4. Verify network connectivity between servers
5. Test the OAuth endpoints manually using curl or Postman

## Manual OAuth Testing

Test the Keycloak endpoints manually:

```bash
# Test well-known endpoint
curl https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration

# Test authorization endpoint (should redirect to login)
curl -L "https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth?client_id=schedule.leadnest&redirect_uri=https://schedule.leadnest.ai/api/auth/callback/keycloak&response_type=code&scope=openid%20email%20profile"

# Test token endpoint (requires authorization code)
curl -X POST https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/token \
  -d "grant_type=authorization_code" \
  -d "client_id=schedule.leadnest" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTH_CODE_FROM_CALLBACK" \
  -d "redirect_uri=https://schedule.leadnest.ai/api/auth/callback/keycloak"
```
