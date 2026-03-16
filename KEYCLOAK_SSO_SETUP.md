# Keycloak SSO Setup Guide for Cal.com

Your Cal.com instance has **built-in Keycloak support**. Follow these steps to enable Keycloak SSO login.

## What I've Already Configured

✅ **Environment Variables Updated** in `.env`:
```env
# Keycloak SSO Configuration
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm

# SAML Database (using same DB as Cal.com for simplicity)
SAML_DATABASE_URL=postgresql://schedule_user:HBuxheui3ebx%40sv3xS@medeasy-postgresql.cveeg8m4s958.us-west-2.rds.amazonaws.com:5432/schedule_db?sslmode=verify-full&sslrootcert=/home/ubuntu/cal.com/global-bundle.pem
SAML_ADMINS=vamshikrishnaakula99@gmail.com
SAML_CLIENT_SECRET_VERIFIER=KE4ieAo9POITxe8nhcYTYq48Xx/H87VbVAQBU3B9X3k=
```

✅ **NextAuth Provider**: Cal.com already has the Keycloak OAuth provider configured in `next-auth-options.ts`

✅ **Login UI**: The login page already has a "Sign in with Keycloak" button

✅ **SAML Client Secret Verifier**: Generated secure random value

## Step 1: SAML Database

**Already configured!** We're using the same `schedule_db` database for simplicity. The SSO tables will be created automatically on first use.

**Note**: For production with high security requirements, consider using a separate database.

## Step 2: Configure Keycloak Client

In your Keycloak Admin Console (`https://auth.leadnest.ai`):

1. **Select Realm**: `prod-leadnest-realm`

2. **Create Client**:
   - Go to **Clients** → **Create client**
   - Client type: `OpenID Connect`
   - Client ID: `schedule.leadnest`

3. **Configure Client**:
   - **Client authentication**: ON
   - **Authorization**: ON
   
4. **Login Settings**:
   - **Valid redirect URIs**:
     ```
     https://schedule.leadnest.ai/api/auth/callback/keycloak
     https://schedule.leadnest.ai/*
     ```
   - **Valid post logout redirect URIs**:
     ```
     https://schedule.leadnest.ai/*
     ```
   - **Web origins**:
     ```
     https://schedule.leadnest.ai
     ```

5. **Credentials**:
   - Go to **Credentials** tab
   - Copy the **Client secret**
   - Verify it matches your `.env`: `KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2`
   - Update if different

6. **Mappers** (usually automatic, but verify):
   - Go to **Client scopes** → `schedule.leadnest-dedicated` → **Add mapper**
   - Add these mappers if not present:
     - `email` → Claim: `email`
     - `name` → Claim: `name`
     - `preferred username` → Claim: `preferred_username`
     - `picture` → Claim: `picture` (if using profile photos)

## Step 3: Restart Cal.com

```bash
# Stop your current Cal.com process
# (however you normally stop it - pm2, systemd, or kill the process)

# Example with pm2:
pm2 restart all

# Example with systemd:
sudo systemctl restart cal-com

# Example if running directly with yarn:
# Kill the current process and run:
yarn build
yarn start

# Watch logs to verify Keycloak provider loads
# Example with pm2:
pm2 logs

# Look for: "next-auth-options" logs showing Keycloak provider
```

## Step 4: Test Keycloak Login

1. **Open Cal.com**: `https://schedule.leadnest.ai/auth/login`

2. **Click "Sign in with Keycloak"** button
   - You should see this button if `KEYCLOAK_*` env vars are loaded correctly

3. **Redirect to Keycloak**:
   - You'll be redirected to `https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth`
   - Enter your Keycloak credentials

4. **Back to Cal.com**:
   - After successful authentication, you'll be redirected to Cal.com
   - You should land on the homepage as a logged-in user

## Troubleshooting

### No "Sign in with Keycloak" button

Check if environment variables are loaded:

```bash
# Check your environment variables
printenv | grep KEYCLOAK
```

You should see:
```
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm
```

If not, make sure your `.env` file is being loaded correctly by your process manager.

### Database migration error

The SAML database needs to be initialized by BoxyHQ's saml-jackson library automatically on first use. If you see errors:

```bash
# Check database connection
psql "$SAML_DATABASE_URL" -c "SELECT 1"

# Check if tables exist (after first SSO initialization)
psql "$SAML_DATABASE_URL" -c "\dt"
```

### Redirect URI Mismatch

Error: `Invalid redirect_uri`

**Solution**: Add all these redirect URIs to Keycloak client:
```
https://schedule.leadnest.ai/api/auth/callback/keycloak
https://schedule.leadnest.ai/*
```

### SSL Certificate Verification Failed

If you see SSL errors connecting to PostgreSQL:

```env
# Try with sslmode=require instead of verify-full
SAML_DATABASE_URL=postgresql://schedule_user:HBuxheui3ebx%40sv3xS@medeasy-postgresql.cveeg8m4s958.us-west-2.rds.amazonaws.com:5432/schedule_saml?sslmode=require
```

Or ensure the certificate path is correct:
```bash
# Verify certificate exists
ls -la /home/ubuntu/cal.com/global-bundle.pem
```

### User not created after successful Keycloak auth

Check the Keycloak response has required fields:

```bash
# Test Keycloak userinfo endpoint
curl -X POST https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/token \
  -d "client_id=schedule.leadnest" \
  -d "client_secret=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2" \
  -d "grant_type=client_credentials"
```

## Alternative: Use Cal.com's OIDC SSO (Team-based)

If you want team-level OIDC configuration instead of instance-wide Keycloak:

1. **Login with admin account**: `vamshikrishnaakula99@gmail.com`

2. **Navigate to**: `https://schedule.leadnest.ai/settings/security/sso`

3. **Configure OIDC**:
   - Client ID: `schedule.leadnest`
   - Client Secret: `oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2`
   - Well Known URL: `https://auth.leadnest.ai/realms/prod-leadnest-realm/.well-known/openid-configuration`

4. **Save** and test

**Note**: This requires an Enterprise License for self-hosted instances.

## Verification Checklist

- [ ] `SAML_DATABASE_URL` configured (using `schedule_db`)
- [ ] `SAML_CLIENT_SECRET_VERIFIER` set to secure random value
- [ ] Keycloak client configured with correct redirect URIs
- [ ] Cal.com restarted with new environment variables
- [ ] "Sign in with Keycloak" button visible on login page
- [ ] Keycloak authentication successful
- [ ] Redirected back to Cal.com homepage after login
- [ ] User account created/linked in Cal.com

## Support

- [Cal.com SSO Documentation](https://github.com/calcom/cal.com/blob/main/docs/self-hosting/sso-setup.mdx)
- [Cal.com Enterprise Features](https://cal.com/sales)
- [BoxyHQ saml-jackson](https://github.com/boxyhq/jackson)
