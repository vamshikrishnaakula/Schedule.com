# ✅ Keycloak SSO Configuration Complete!

## What Was Done

### 1. Environment Variables Configured
Your `.env` file now has:
- ✅ `KEYCLOAK_CLIENT_ID=schedule.leadnest`
- ✅ `KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2`
- ✅ `KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm`
- ✅ `SAML_DATABASE_URL` (using your existing `schedule_db`)
- ✅ `SAML_ADMINS=vamshikrishnaakula99@gmail.com`
- ✅ `SAML_CLIENT_SECRET_VERIFIER` (secure random value generated)

### 2. Code Cleanup
- ✅ Removed incorrect custom KeycloakProvider from `[...nextauth].ts`
- ✅ Cal.com's built-in Keycloak provider will be used instead

### 3. Files Created
- ✅ `KEYCLOAK_SSO_SETUP.md` - Complete setup guide
- ✅ `verify-keycloak-setup.sh` - Verification script

## 🚀 Next Steps to Enable Keycloak Login

### Step 1: Restart Cal.com

Restart your Cal.com instance to load the new environment variables:

```bash
# If using pm2
pm2 restart all

# If using systemd
sudo systemctl restart cal-com

# If running directly
# Stop current process, then:
yarn build
yarn start
```

### Step 2: Verify Keycloak Client Configuration

In your Keycloak Admin Console at `https://auth.leadnest.ai`:

1. **Realm**: `prod-leadnest-realm`
2. **Client**: `schedule.leadnest`
3. **Verify these settings**:

   **Valid redirect URIs**:
   ```
   https://schedule.leadnest.ai/api/auth/callback/keycloak
   https://schedule.leadnest.ai/*
   ```

   **Valid post logout redirect URIs**:
   ```
   https://schedule.leadnest.ai/*
   ```

   **Web origins**:
   ```
   https://schedule.leadnest.ai
   ```

### Step 3: Test Login

1. Open: `https://schedule.leadnest.ai/`
2. You should see a **"Sign in with Keycloak"** button
3. Click it
4. You'll be redirected to Keycloak login
5. Enter your Keycloak credentials
6. After successful auth, you'll be redirected to Cal.com homepage

## 🔍 Troubleshooting

### No "Sign in with Keycloak" button?

Check logs after restart:
```bash
# If using pm2
pm2 logs

# Look for Keycloak provider initialization
```

Verify env vars are loaded:
```bash
printenv | grep KEYCLOAK
```

### Redirect URI Error?

Add these to your Keycloak client's redirect URIs:
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
https://schedule.leadnest.ai/*
```

### User not created after login?

Check that Keycloak returns these claims:
- `email` (required)
- `name` or `preferred_username`
- `email_verified`

## 📁 Reference Files

- **Setup Guide**: `KEYCLOAK_SSO_SETUP.md`
- **Verification Script**: `verify-keycloak-setup.sh`
- **Environment File**: `.env`
- **Login Page**: `apps/web/modules/auth/login-view.tsx`
- **Auth Config**: `packages/features/auth/lib/next-auth-options.ts`

## 🎯 Expected Flow

```
User visits /auth/login
    ↓
Clicks "Sign in with Keycloak"
    ↓
Redirected to Keycloak:
https://auth.leadnest.ai/realms/prod-leadnest-realm/
protocol/openid-connect/auth
    ↓
User enters Keycloak credentials
    ↓
Keycloak redirects back to:
https://schedule.leadnest.ai/api/auth/callback/keycloak
    ↓
Cal.com creates/updates user account
    ↓
User lands on Cal.com homepage (logged in)
```

## ✅ Success Indicators

After restart, you should see:
- ✓ "Sign in with Keycloak" button on login page
- ✓ Redirect to Keycloak when clicked
- ✓ Successful authentication
- ✓ Redirect back to Cal.com
- ✓ User created in database with `identityProvider = 'KEYCLOAK'`

---

**Need help?** Check `KEYCLOAK_SSO_SETUP.md` for detailed troubleshooting.
